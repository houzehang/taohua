import { SHOW_ALERT, SHOW_CONFIRM, HIDE_DIALOG } from '../constants/ActionTypes'

const dialog = (state = {
	type     : "alert",
	configure: {
		content : ""
	},
}, action) => {
	switch (action.type) {
		case SHOW_ALERT:
		return {
			...state,
			type     : "alert",
			configure: action.configure,
			showing  : true
		}
		case SHOW_CONFIRM:
		return {
			...state,
			type  	  : "confirm",
			configure : action.configure,
			showing   : true
		}
		case HIDE_DIALOG:
		return {
			...state,
			showing  : false
		}
		default:
		return state
	}
}

export default dialog