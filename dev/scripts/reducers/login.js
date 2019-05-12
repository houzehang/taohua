import { LOGIN_SUCCESS, LOGOUT, CHANGE_USER_INFO } from '../constants/ActionTypes'

const login = (state = {}, action) => {
	switch (action.type) {
		case LOGIN_SUCCESS:
		return {
			...state,
			account: action.account
		}
		case LOGOUT:
		return {
			...state,
			account: null
		}
		case CHANGE_USER_INFO:
		return {
			...state,
			account: action.user
		}
		default:
		return state
	}
}

export default login