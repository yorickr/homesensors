import React, {Component} from 'react';

import RaisedButton from 'material-ui/RaisedButton';
import DatePicker from 'material-ui/DatePicker';
import TimePicker from 'material-ui/TimePicker';
import Popover from 'material-ui/Popover';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';

import moment from 'moment';

import './style.css';

import Chart from '../chart';

import Api from '../../utils/api';

// const durationSelection  = {
//     '5 minutes': 5,
//     'hourly': 60,
//     'daily': 1440,
// };

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
            durationSelectorOpen: false,
            durationButtonLabel: '5 minutes',

            dateButtonLabel: 'Today',
            dateSelectorOpen: false,
        };

        localStorage.setItem('username', 'kaas');

        this.onButtonClick = this.onButtonClick.bind(this);
        this.durationSelectorClick = this.durationSelectorClick.bind(this);
        this.durationSelectorCancel = this.durationSelectorCancel.bind(this);
        this.dateSelectorClick = this.dateSelectorClick.bind(this);
        this.dateSelectorCancel = this.dateSelectorCancel.bind(this);

    }

    onButtonClick () {
        const username = localStorage.getItem('username');
        const password = localStorage.getItem('password');
        if (!username || !password) {
            alert('Log in before attempting to retrieve data');
            return;
        }
        Api.post('http://localhost:3030/api/user/login', {username, password})
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
                return Api.get('http://localhost:3030/api/data/measurement/1/' + this.state.startDateTime.format() + '/' + this.state.endDateTime.format());
            })
            .then((response) => {
                // show by hour.
                const toAdd = 60;
                var count = 0;
                const groupedData = [];
                var totalValue = 0;
                var timeOfGroupedValue = moment();
                for (var i = 0; i < response.data.length; i++) {
                    if (count === 0) {
                        timeOfGroupedValue = moment(response.data[i].insertTime).startOf('hour');
                    }
                    totalValue += response.data[i].value;
                    if (count === toAdd) {
                        groupedData.push({temperature: (totalValue / count).toFixed(2), time: timeOfGroupedValue.format('HH')});
                        count = 0;
                        totalValue = 0;
                    } else {
                        count++;
                    }
                }
                // we might not always hit 60, so catch the remainder after the for loop.
                groupedData.push({temperature: (totalValue / count).toFixed(2), time: timeOfGroupedValue.format('HH')});
                this.setState({data: groupedData});
            })
            .catch((error) => {
                console.log(error);
            });
    }

    durationSelectorClick (e) {
        // This prevents ghost click.
        e.preventDefault();

        this.setState({
            durationSelectorOpen: true,
            anchorEl: e.currentTarget,
        });
    }

    durationSelectorCancel() {
        this.setState({
            durationSelectorOpen: false,
        });
    }

    dateSelectorClick (e) {
        // This prevents ghost click.
        e.preventDefault();

        this.setState({
            dateSelectorOpen: true,
            anchorEl2: e.currentTarget,
        });
    }

    dateSelectorCancel() {
        this.setState({
            dateSelectorOpen: false,
        });
    }


    render () {
        return (
            <div className="dashboard">
                <div className="top-buttons-section">
                    <div className="duration-selector">
                        <RaisedButton
                            onClick={this.durationSelectorClick}
                            label={this.state.durationButtonLabel}
                        />
                        <Popover
                            open={this.state.durationSelectorOpen}
                            anchorEl={this.state.anchorEl}
                            anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
                            targetOrigin={{horizontal: 'left', vertical: 'top'}}
                            onRequestClose={this.durationSelectorCancel}
                        >
                            <Menu>
                                <MenuItem primaryText="5 minutes" />
                                <MenuItem primaryText="Hourly" />
                                <MenuItem primaryText="Daily" />
                            </Menu>
                        </Popover>
                    </div>
                    <div className="duration-selector">
                        <RaisedButton
                            onClick={this.dateSelectorClick}
                            label={this.state.dateButtonLabel}
                        />
                        <Popover
                            open={this.state.dateSelectorOpen}
                            anchorEl={this.state.anchorEl2}
                            anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
                            targetOrigin={{horizontal: 'left', vertical: 'top'}}
                            onRequestClose={this.dateSelectorCancel}
                        >
                            <Menu>
                                <MenuItem primaryText="5 minutes" />
                                <MenuItem primaryText="Hourly" />
                                <MenuItem primaryText="Daily" />
                            </Menu>
                        </Popover>
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
