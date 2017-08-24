import React, {Component} from 'react';

import RaisedButton from 'material-ui/RaisedButton';
import DatePicker from 'material-ui/DatePicker';
import TimePicker from 'material-ui/TimePicker';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import TextField from 'material-ui/TextField';


import moment from 'moment';

import './style.css';

import Chart from '../chart';

import Api from '../../utils/api';

const durationSelection  = [
    {
        text: '5 minutes',
        value: 5,
    },
    {
        text: 'Hourly',
        value: 60,
    },
    {
        text: 'Daily',
        value: 1440,
    }
];

const dateSelection = [
    {
        text: 'Today',
        value: 1,
    },
    {
        text: 'Yesterday',
        value: 2,
    },
    {
        text: 'This week',
        value: 3,
    },
    {
        text: 'Last week',
        value: 4,
    },
    {
        text: 'This month',
        value: 5,
    },
    {
        text: 'Last month',
        value: 6,
    },
];

class Dashboard extends Component {

    constructor () {
        super();
        const startDateTime = moment();
        startDateTime.startOf('day');
        const endDateTime = moment();
        endDateTime.endOf('day');
        this.state = {
            userId: null,
            data: [],
            startDateTime: startDateTime,
            endDateTime: endDateTime,

            durationValue: 5,
            dateValue: 1,
            sensorValue: 0,
            sensorSelection: [],

            username: localStorage.getItem('username'),
            password: localStorage.getItem('password'),

            charts: []
        };

        this.onButtonClick = this.onButtonClick.bind(this);
        this.handleChangeDuration = this.handleChangeDuration.bind(this);
        this.handleChangeDate = this.handleChangeDate.bind(this);
        this.handlechangeSensor = this.handlechangeSensor.bind(this);

        this.fetchInitialData = this.fetchInitialData.bind(this);
        this.componentDidMount = this.componentDidMount.bind(this);
        this.refreshData = this.refreshData.bind(this);
    }

    componentDidMount () {

        if (!localStorage.getItem('token')) {
            // no token available, user should login.
            const username = localStorage.getItem('username');
            const password = localStorage.getItem('password');
            if (username && password) {
                Api.post('/user/login', {username, password})
                    .then((response) => {
                        if (response.success) {
                            const {token, userId} = response.data;
                            localStorage.setItem('token', token);
                            Api.refreshToken();
                            this.setState({userId});
                            this.fetchInitialData();
                        } else {
                            // no token
                            throw new Error('No token received');
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                        throw new Error('Something went wrong logging in');
                    });
            } else {
                // can't get token, make user login.
            }
        } else {
            // we have a token. proceed as usual.
            Api.refreshToken(); // just in case
            this.fetchInitialData();
        }
    }

    groupDataOfKind (originalData, type) {
        const toAdd = this.state.durationValue;
        var startOfString;
        var formatString;
        switch (toAdd) {
            case 5:
                startOfString = 'minute';
                formatString = 'HH:mm';
                break;
            case 60:
                startOfString = 'hour';
                formatString = 'HH';
                break;
            case 1440:
                startOfString = 'day';
                formatString = 'DD';
                break;
            default:
                startOfString = 'hour';
                formatString = 'HH';
                break;
        }

        var processed = true;
        var dataGroup = [];
        const groupedData = [];

        var timeOfGroupedValue; // start time of this group
        var timePlus; // the start time plus X (so 5 minutes, 1 hour etc)
        for (var i = 0; i < originalData.data.length; i++) {
            const timeOfMeasurement = moment(originalData.data[i].insertTime);
            if (processed) {
                timeOfGroupedValue = moment(timeOfMeasurement);
                timePlus = moment(timeOfMeasurement).add(toAdd, 'm').startOf(startOfString);
                processed = false;
            }

            if (timeOfMeasurement.isAfter(timePlus)) {
                // we have a new measurement starting with timeOfMeasurement
                const totalValue = dataGroup.reduce((prev, next) => {
                    return prev + next;
                }, 0);
                const avgValue = totalValue / dataGroup.length;
                const objToPush = {time: timeOfGroupedValue.format(formatString)};
                objToPush[type] = avgValue.toFixed(2);
                groupedData.push(objToPush);
                dataGroup = [originalData.data[i].value];
                const temp = moment(originalData.data[i].insertTime);
                timeOfGroupedValue = moment(temp);
                timePlus = moment(temp).add(toAdd, 'm').startOf('minute');
                continue;
            }
            dataGroup.push(originalData.data[i].value);
        }
        // catch remainder after loop.
        const totalValue = dataGroup.reduce((prev, next) => {
            return prev + next;
        }, 0);
        const avgValue = totalValue / dataGroup.length;
        const objToPush = {time: timeOfGroupedValue.format(formatString)};
        objToPush[type] = avgValue.toFixed(2);
        groupedData.push(objToPush);
        return groupedData;
    }

    fetchInitialData () {
        Api.get('/sensor/available')
            .then((response) => {
                if (response.data.length > 0) {
                    const selectedSensor = response.data[0].sensor_id;
                    const sensors = response.data.map((sensor) => {
                        return {
                            text: sensor['name'],
                            value: sensor['sensor_id']
                        };
                    });

                    this.setState({sensorValue: selectedSensor, sensorSelection: sensors});
                    this.refreshData();
                    return;
                } else {
                    return Promise.reject();
                }
            })
            .catch((error) => {
                console.log(error);
                alert('Something went wrong fetching initial Data');
            });
    }

    refreshData () {
        // fetch available data from remote for sensor
        // fetch available remote sensors
        Api.get('/data/types/' + this.state.sensorValue)
            .then((response) => {
                const types = response;
                if (types.success) {
                    const promises = types.data.map((type) => {
                        return Api.get('/data/measurement/' + this.state.sensorValue + '/' + this.state.startDateTime.format() + '/' + this.state.endDateTime.format() + '/' + type);
                    });
                    promises.push(Promise.resolve(types));
                    return Promise.all(promises);
                } else {
                    Promise.reject();
                }
            })
            .then((response) => {
                const types = response[response.length - 1];
                // format charts according to response.data
                const charts = types.data.map((type, index) => {
                    return {
                        dataKeyX: "time",
                        dataKeyY: type,
                        data: this.groupDataOfKind(response[index], type)
                    };
                });
                this.setState({charts});
            })
            .catch((error) => {
                console.log(error);
                alert('Something went wrong fetching data on mount');
            });
    }

    onButtonClick () {
        if (this.state.username && this.state.password) { // TODO: don't do this in state.
            localStorage.setItem('username', this.state.username);
            localStorage.setItem('password', this.state.password);
        }
        const username = localStorage.getItem('username');
        const password = localStorage.getItem('password');
        if (!username || !password) {
            alert('Log in before attempting to retrieve data');
            return;
        }
        this.refreshData();
    }

    handleChangeDuration (event, index, value) {
        this.setState({durationValue: value});
    }

    handleChangeDate (event, index, value) {
        var startDateTime;
        var endDateTime;
        switch (value) {
            case 1: // today
                startDateTime = moment();
                startDateTime.startOf('day');
                endDateTime = moment();
                endDateTime.endOf('day');
                this.setState({startDateTime, endDateTime});
                break;
            case 2: // yesterday
                startDateTime = moment().subtract(1, 'day');
                startDateTime.startOf('day');
                endDateTime = moment().subtract(1, 'day');
                endDateTime.endOf('day');
                this.setState({startDateTime, endDateTime});
                break;
            case 3: // this week
                startDateTime = moment().weekday(0);
                startDateTime.startOf('day');
                endDateTime = moment();
                endDateTime.endOf('day');
                this.setState({startDateTime, endDateTime});
                break;
            case 4: // last week
                startDateTime = moment().weekday(-7);
                startDateTime.startOf('day');
                endDateTime = moment().weekday(0);
                endDateTime.endOf('day');
                this.setState({startDateTime, endDateTime});
                break;
            case 5: // this month
                startDateTime = moment().startOf('month');
                startDateTime.startOf('day');
                endDateTime = moment().endOf('month');
                endDateTime.endOf('day');
                this.setState({startDateTime, endDateTime});
                break;
            case 6: // last month
                startDateTime = moment().subtract(1, 'month').startOf('month');
                startDateTime.startOf('day');
                endDateTime = moment().subtract(1, 'month').endOf('month');
                endDateTime.endOf('day');
                this.setState({startDateTime, endDateTime});
                break;
            default: // default to today
                throw new Error('This code should not be reached ever');

        }
        this.setState({dateValue: value});
    }

    handlechangeSensor (event, index, value) {
        this.setState({sensorValue: value});
    }

    render () {
        return (
            <div className="dashboard">
                <TextField
                    floatingLabelText="Username"
                    value={this.state.username}
                    onChange={(event, value) => this.setState({username: value})}
                />
                <TextField
                    floatingLabelText="Password"
                    value={this.state.password}
                    onChange={(event, value) => this.setState({password: value})}
                    type="password"
                />
                <div className="top-buttons-section">
                    <div className="duration-selector">
                        <DropDownMenu className="dropdown" value={this.state.durationValue} onChange={this.handleChangeDuration} autoWidth={false}>
                            {durationSelection.map((entry, index) => {
                                return (
                                    <MenuItem value={entry.value} primaryText={entry.text} key={index}/>
                                );
                            })}
                        </DropDownMenu>
                    </div>
                    <div className="duration-selector">
                        <DropDownMenu className="dropdown" value={this.state.dateValue} onChange={this.handleChangeDate} autoWidth={false}>
                            {dateSelection.map((entry, index) => {
                                return (
                                    <MenuItem value={entry.value} primaryText={entry.text} key={index}/>
                                );
                            })}
                        </DropDownMenu>
                    </div>
                    <div className="duration-selector">
                        <DropDownMenu className="dropdown" value={this.state.sensorValue} onChange={this.handlechangeSensor} autoWidth={false}>
                            {this.state.sensorSelection.map((entry, index) => {
                                return (
                                    <MenuItem value={entry.value} primaryText={entry.text} key={index}/>
                                );
                            })}
                        </DropDownMenu>
                    </div>
                </div>
                <div className="chart-container">
                    {this.state.charts.map((chart, index) => {
                        return <Chart key={index} data={chart.data} dataKeyX={chart.dataKeyX} dataKeyY={chart.dataKeyY} />;
                    })}
                </div>
                <div className="date-container">
                    <div className="date-picker-container">
                        <div>
                            Pick a start date
                        </div>
                        <DatePicker
                            hintText="Pick a start date"
                            mode="landscape"
                            value={this.state.startDateTime.toDate()}
                            onChange={(event, value) => this.setState({startDateTime: moment(value).hours(this.state.startDateTime.hours()).minutes(this.state.startDateTime.minutes())})}
                            autoOk={true}
                        />
                        <TimePicker
                            format="24hr"
                            hintText="24hr Format"
                            value={this.state.startDateTime.toDate()}
                            onChange={(event, value) => this.setState({startDateTime: moment(value)})}
                        />
                    </div>
                    <div className="date-picker-container">
                        <div>
                            Pick an end date
                        </div>
                        <DatePicker
                            hintText="Pick an end date"
                            mode="landscape"
                            value={this.state.endDateTime.toDate()}
                            onChange={(event, value) => this.setState({endDateTime: moment(value).hours(this.state.endDateTime.hours()).minutes(this.state.endDateTime.minutes())})}
                            autoOk={true}
                            className="picker"
                        />
                        <TimePicker
                            format="24hr"
                            hintText="24hr Format"
                            value={this.state.endDateTime.toDate()}
                            onChange={(event, value) => this.setState({endDateTime: moment(value)})}
                        />
                    </div>
                </div>
                <RaisedButton label="Refresh" primary={true} onClick={this.onButtonClick} />
            </div>
        );
    }
}

export default Dashboard;
