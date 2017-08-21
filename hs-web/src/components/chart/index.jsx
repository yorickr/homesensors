import React, {Component} from 'react';

import {LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line} from 'recharts';

import './style.css';

// const data = [
//       {name: 'Page A', uv: 4000, pv: 2400, amt: 2400},
//       {name: 'Page B', uv: 3000, pv: 1398, amt: 2210},
//       {name: 'Page C', uv: 2000, pv: 9800, amt: 2290},
//       {name: 'Page D', uv: 2780, pv: 3908, amt: 2000},
//       {name: 'Page E', uv: 1890, pv: 4800, amt: 2181},
//       {name: 'Page F', uv: 2390, pv: 3800, amt: 2500},
//       {name: 'Page G', uv: 3490, pv: 4300, amt: 2100},
// ];

const arrayMin = (arr) => {
    return arr.reduce(function (p, v) {
        return ( p < v ? p : v );
    }, Number.MAX_SAFE_INTEGER);
};

const arrayMax = (arr) => {
    return arr.reduce(function (p, v) {
        return ( p > v ? p : v );
    }, Number.MIN_SAFE_INTEGER);
};

class Chart extends Component {
    render() {
        var domain;
        if (this.props.data.length > 0) {
            const dataMin = arrayMin(this.props.data.map((entry) => entry.temperature));
            const dataMax = arrayMax(this.props.data.map((entry) => entry.temperature));
            console.log({dataMin, dataMax});
            domain = [(parseInt(dataMin, 10) - 10), (parseInt(dataMax, 10) + 10)];
            console.log(domain);
        } else {
            domain = ['auto', 'auto'];
        }

        return (
            <LineChart width={600} height={400} data={this.props.data}
                    margin={{top: 5, right: 30, left: 20, bottom: 5}}>
               <XAxis dataKey="time"/>
               <YAxis dataKey="temperature" type="number" domain={domain}/>
               <CartesianGrid strokeDasharray="3 3"/>
               <Tooltip/>
               <Legend />
               <Line type="monotone" dataKey="temperature" stroke="#8884d8" activeDot={{r: 8}}/>
          </LineChart>
        )
    }
}

//                <Line type="monotone" dataKey="uv" stroke="#82ca9d" />

export default Chart;
