/**
 * 样式文件
 */
require('../less/anim.less')
require('../less/common.less')
require('../less/main.less')

import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux'
import rootReducer from './reducers'
import { createStore, applyMiddleware } from 'redux'
import App from './containers/entry.page'
import { restoreUserInfo } from './actions'
import thunk from 'redux-thunk'
const {ipcRenderer} = $require('electron');
ipcRenderer.on('configure', (event, data)=>{
	console.log("configure",data)
	if (!window.ENV_CONF) {
		window.ENV_CONF = {}
	}
	for (let key in data) {
		window.ENV_CONF[key] = data[key]
	}
})

const middleware = [ thunk ];
const store = createStore(
	rootReducer,
	applyMiddleware(...middleware)
)
store.dispatch(restoreUserInfo())
render(
	<Provider store={store}>
		<App/>
	</Provider>, 
	document.getElementById("app")
)