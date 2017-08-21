import React, {Component} from 'react';

import {Route, Redirect} from 'react-router-dom';
import AppBar from 'material-ui/AppBar';

import './style.css';

import Dashboard from './components/dashboard/';

class App extends Component {
    render() {
        return (
            <div>
                <AppBar title="Hi"/>
                <Route path="/dashboard" component={Dashboard}/>
                <Redirect from="/" to="/dashboard" />
            </div>
        )
    }
}

export default App;
