import React, {Component} from 'react';

import RaisedButton from 'material-ui/RaisedButton';
import DatePicker from 'material-ui/DatePicker';
import TimePicker from 'material-ui/TimePicker';

import moment from 'moment';

import './style.css';

import Chart from '../chart';

import Api from '../../utils/api';

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
        };

        this.onButtonClick = this.onButtonClick.bind(this);
    }

    onButtonClick () {

        Api.post('http://localhost:3030/api/user/login', {username: '', password: ''})
            .then((response) => {
                console.log(response);
                if (response.success) {
                    const {token, userId} = response.data;
                    Api.setToken(token);
                    this.setState({userId});
                } else {
                    // no token
                }
            })
            .then(() => {
                return Api.get('http://localhost:3030/api/data/measurement/1/' + this.state.startDateTime.format() + '/' + this.state.endDateTime.format());
            })
            .then((response) => {
                console.log(response);
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
                console.log(groupedData);
                this.setState({data: groupedData});
            });
    }

    render () {
        return (
            <div className="dashboard">
                <Chart data={this.state.data}/>
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
                <DatePicker
                    hintText="Pick an end date"
                    mode="landscape"
                    value={this.state.endDateTime.toDate()}
                    onChange={(event, value) => this.setState({endDateTime: moment(value).hours(this.state.endDateTime.hours()).minutes(this.state.endDateTime.minutes())})}
                    autoOk={true}
                />
                <TimePicker
                    format="24hr"
                    hintText="24hr Format"
                    value={this.state.endDateTime.toDate()}
                    onChange={(event, value) => this.setState({endDateTime: moment(value)})}
                />
                <RaisedButton label="Primary" primary={true} onClick={this.onButtonClick} />
            </div>
        );
    }
}

export default Dashboard;
