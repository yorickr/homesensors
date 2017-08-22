import React, {Component} from 'react';

import RaisedButton from 'material-ui/RaisedButton';
import DatePicker from 'material-ui/DatePicker';
import TimePicker from 'material-ui/TimePicker';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';

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
        };

        localStorage.setItem('username', 'yorickr');

        this.onButtonClick = this.onButtonClick.bind(this);
        this.handleChangeDuration = this.handleChangeDuration.bind(this);
        this.handleChangeDate = this.handleChangeDate.bind(this);
    }

    onButtonClick () {
        const username = localStorage.getItem('username');
        const password = localStorage.getItem('password');
        if (!username || !password) {
            alert('Log in before attempting to retrieve data');
            return;
        }
        Api.post('/user/login', {username, password})
            .then((response) => {
                if (response.success) {
                    const {token, userId} = response.data;
                    Api.setToken(token);
                    this.setState({userId});
                } else {
                    // no token
                    throw new Error('No token received');
                }
            })
            .then(() => {
                return Api.get('/data/measurement/1/' + this.state.startDateTime.format() + '/' + this.state.endDateTime.format());
            })
            .then((response) => {
                // show by hour.
                // when hourly, toAdd is 60, use startOf('hour')
                // when every 5 minutes, toAdd is 5, use startOf
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
                for (var i = 0; i < response.data.length; i++) {
                    const timeOfMeasurement = moment(response.data[i].insertTime);
                    if (processed) {
                        timeOfGroupedValue = moment(timeOfMeasurement);
                        timePlus = moment(timeOfMeasurement).add(toAdd, 'm').startOf(startOfString);
                        console.log(timeOfGroupedValue.format());
                        console.log(timePlus.format());
                        processed = false;
                    }

                    if (timeOfMeasurement.isAfter(timePlus)) {
                        // we have a new measurement starting with timeOfMeasurement
                        const totalValue = dataGroup.reduce((prev, next) => {
                            return prev + next;
                        }, 0);
                        const avgValue = totalValue / dataGroup.length;
                        groupedData.push({temperature: avgValue.toFixed(2), time: timeOfGroupedValue.format(formatString)});
                        dataGroup = [response.data[i].value];
                        const temp = moment(response.data[i].insertTime);
                        timeOfGroupedValue = moment(temp);
                        timePlus = moment(temp).add(toAdd, 'm').startOf('minute');
                        continue;
                    }
                    dataGroup.push(response.data[i].value);
                }
                // catch remainder after loop.
                const totalValue = dataGroup.reduce((prev, next) => {
                    return prev + next;
                }, 0);
                const avgValue = totalValue / dataGroup.length;
                groupedData.push({temperature: avgValue.toFixed(2), time: timeOfGroupedValue.format(formatString)});
                console.log(groupedData);
                this.setState({data: groupedData});
            })
            .catch((error) => {
                console.log(error);
            });
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

    render () {
        return (
            <div className="dashboard">
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
                </div>
                <Chart data={this.state.data}/>
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
