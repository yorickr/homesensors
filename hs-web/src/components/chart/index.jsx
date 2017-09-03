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
    var min = Number.MAX_SAFE_INTEGER;
    for (var i = 0; i < arr.length; i++) {
        const value = parseFloat(arr[i], 10);
        if (value < min) {
            min = value;
        }
    }
    return min;
};

const arrayMax = (arr) => {
    var max = Number.MIN_SAFE_INTEGER;
    for (var i = 0; i < arr.length; i++) {
        const value = parseFloat(arr[i], 10);
        if (value > max) {
            max = value;
        }
    }
    return max;
};

class Chart extends Component {
    render() {
        var domain;
        if (this.props.data.length > 0) {
            const array = this.props.data.map((entry) => entry[this.props.dataKeyY]);
            const dataMin = arrayMin(array);
            const dataMax = arrayMax(array);
            domain = [(parseInt(dataMin, 10) - 10), (parseInt(dataMax, 10) + 10)];
        } else {
            domain = ['auto', 'auto'];
        }

        return (
            <LineChart width={600} height={400} data={this.props.data} className="chart"
                    margin={{top: 5, right: 30, left: 20, bottom: 5}}>
               <XAxis dataKey={this.props.dataKeyX}/>
               <YAxis dataKey={this.props.dataKeyY} type="number" domain={domain}/>
               <CartesianGrid strokeDasharray="3 3"/>
               <Tooltip/>
               <Legend />
               <Line type="monotone" dataKey={this.props.dataKeyY} stroke="#8884d8" activeDot={{r: 8}}/>
          </LineChart>
        )
    }
}

//                <Line type="monotone" dataKey="uv" stroke="#82ca9d" />

export default Chart;
