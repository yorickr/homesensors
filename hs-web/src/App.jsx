import React, {Component} from 'react';

import {Route, Redirect} from 'react-router-dom';

import Dashboard from './components/dashboard/';
import Header from './components/header/';

class App extends Component {
    render() {
        return (
            <div>
                <Header/>
                <Route path="/dashboard" component={Dashboard}/>
                <Redirect from="/" to="/dashboard" />
            </div>
        )
    }
}

export default App;
