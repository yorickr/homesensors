import React, {Component} from 'react';

import './style.css';

import Chart from '../chart';

class Dashboard extends Component {
    render() {
        return (
            <div className="dashboard">
                dashboard
                <Chart/>
            </div>
        )
    }
}

export default Dashboard;
