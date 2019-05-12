import { ROOM_LIST, CALENDAR_DATA, ROOM_INFO, START_COURSE, END_COURSE, ROOM_GIFT, ROOM_MORE_INFO, USER_MUTED, NEW_STREAM, STREAM_LEAVE, CHANNEL_NEW_USER, HANDSUP_SWITCH, GIFT_SWITCH, MAGIC_SWITCH, RANK_SWITCH, NEW_GIFT, HANDSUP_RANK, DANCING, COURSE_BEGIN, COURSE_PAUSE, COURSE_RESUME, COURSE_END, COURSE_TICK, COURSE_STARTING_TICK,  MUTEALL_SWITCH, SILENT_SWITCH,GIFT_UPDATE,PROGRESS_UPDATE,PROGRESS_RESET, USER_ADD_ROOM, WARN } from '../constants/ActionTypes'
const storage = require('../Storage')

const room = (state = {}, action) => {
	let streamId, teacher, switches, students, dancing, status
	switch (action.type) {
		case ROOM_INFO:
		let data = action.data
		let teacher = {
			child_name: data.teacher_name,
			avatarurl: data.teacher_avatar,
			id: data.teacher_id
		}

		let curTime = Date.now();

		let parsed = data.start_time.split(/[-: ]/)
		let date = new Date(parsed[0], parsed[1] - 1, parsed[2] || 1, parsed[3] || 0, parsed[4] || 0, parsed[5] || 0);
		let waiting = date.getTime() - Date.now();
		let storedData = storage.get("STATUS_"+data.channel_id)
		if (storedData) {
			status = storedData
		} else {
			status = { duration: action.data.duration, waiting:waiting, id: data.channel_id, dancetimes_hash: {}  }
		}
		status = status || {}
		status.waiting = waiting;
		return {
			...state,
			info: action.data,
			switches: {
				gift: true,
				muteall:true
			},
			dancing: [],
			status,
			teacher
		}
		case ROOM_GIFT:
		return {
			...state,
			gifts: action.data
		}
		case ROOM_MORE_INFO:
		let info = {...state.info}
		info.channel_token = action.data.channel_token
		info.features = action.data.features
		return {
			...state,
			info,
			students: action.data.students
		}
		case NEW_GIFT:
		let gift = action.data
		students = [...state.students]
		for(let i=0,len=students.length;i<len;i++) {
			let item = students[i]
			if (item.id == gift.uid) {
				item.gift_total = gift.total
			}
		}
		return {
			...state,
			students
		}
		case WARN:
		let warn_info = action.data
		students = [...state.students]
		for(let i=0,len=students.length;i<len;i++) {
			let item = students[i]
			if (item.id == warn_info.uid) {
				item.warn = action.status
			}else{
				item.warn = false
			}
		}
		return {
			...state,
			students
		}

		case USER_MUTED:
		students = [...state.students]
		if (students) {
			for(let i=0,len=students.length;i<len;i++) {
				let item = students[i]
				if (item.id == action.id) {
					item.unmuted = !action.mute
					if (item.unmuted && !action.recovering) {
						item.speak++
					}
				}
			}
		}
		return {
			...state,
			students
		}
		case USER_ADD_ROOM:
		teacher  = {...state.teacher}
		if (action.id == teacher.id) {
			teacher.online = true
			return {
				...state,
				teacher
			}
		} else {
			students = [...state.students]
			for(let i=0,len=students.length;i<len;i++) {
				let item = students[i]
				if (item.id == action.id) {
					item.online = true
					item.online_time = new Date().getTime()
					break
				}
			}
			return {
				...state,
				students
			}
		}
		case NEW_STREAM:
		streamId = action.stream.getId()
		teacher  = {...state.teacher}
		if (streamId == teacher.id) {
			teacher.stream = action.stream
			teacher.online = true
			teacher.stream_inited = false
			return {
				...state,
				teacher
			}
		} else {
			students = [...state.students]
			for(let i=0,len=students.length;i<len;i++) {
				let item = students[i]
				if (item.id == action.stream.getId()) {
					item.stream = action.stream
					item.online = true
					if (!item.online_time) {
						item.online_time = new Date().getTime()
					}
					item.stream_inited = false
				}
			}
			return {
				...state,
				students
			}
		}
		case STREAM_LEAVE:
		streamId = action.stream.getId()
		teacher  = {...state.teacher}
		if (streamId == teacher.id) {
			teacher.stream = null
			teacher.online = false
			teacher.stream_inited = false
			return {
				...state,
				teacher
			}
		} else {
			students = [...state.students]
			for(let i=0,len=students.length;i<len;i++) {
				let item = students[i]
				if (item.id == streamId) {
					item.stream        = null
					item.online_time   = null
					item.online		   = false
					item.dancing 	   = false
					item.stream_inited = false
				}
			}
			return {
				...state,
				students
			}
		}
		case HANDSUP_SWITCH:
		switches = {...state.switches}
		switches.handsup = action.status
		state.students = state.students || [];
		students = [...state.students]
		if (students) {
			for(let i=0,len=students.length;i<len;i++) {
				let item = students[i]
				item.rank = null
			}
		}
		return {
			...state,
			switches,
			students
		}
		case GIFT_SWITCH:
		switches = {...state.switches}
		switches.gift = action.status
		return {
			...state,
			switches
		}
		case MAGIC_SWITCH:
		switches = {...state.switches}
		switches.magic = action.status
		return {
			...state,
			switches
		}
		case MUTEALL_SWITCH:
		switches = {...state.switches}
		students = [...state.students]
		if (students) {
			for(let i=0,len=students.length;i<len;i++) {
				let item = students[i]
				item.unmuted = !action.status
			}
		}
		switches.muteall = action.status
		return {
			...state,
			students,
			switches
		}
		case RANK_SWITCH:
		switches = {...state.switches}
		switches.rank = action.status
		return {
			...state,
			switches
		}
		case SILENT_SWITCH:
		switches = {...state.switches}
		switches.silent = action.status
		return {
			...state,
			switches
		}
		case HANDSUP_RANK:
		students = [...state.students]
		if (students) {
			for(let i=0,len=students.length;i<len;i++) {
				let item = students[i]
				if (item.id == action.id) {
					item.rank = action.rank
					item.handsup++
					break
				}
			}
		}
		return {
			...state,
			students
		}
		case DANCING:
		students = [...state.students]
		status   = {...state.status}
		if (students) {
			for(let i=0,len=students.length;i<len;i++) {
				let item = students[i]
				if (item.id == action.id) {
					item.dancing = action.status
					if (item.dancing && !action.recovering) {
						if(!status.dancetimes_hash){
							status.dancetimes_hash = {}
						}
						if(!status.dancetimes_hash[item.id]){
							status.dancetimes_hash[item.id] = 0
						}
						status.dancetimes_hash[item.id]++
						storage.store("STATUS_"+status.id, status)
					}
				} else {
					item.dancing = false
				}
			}
		}
		return {
			...state,
			students
		}
		case COURSE_BEGIN:
		status = {...state.status}
		status.started = true
		storage.store("STATUS_"+status.id, status)
		return {
			...state,
			status
		}
		case COURSE_PAUSE:
		status = {...state.status}
		status.paused = true
		storage.store("STATUS_"+status.id, status)
		return {
			...state,
			status
		}
		case COURSE_RESUME:
		status = {...state.status}
		status.paused = false
		storage.store("STATUS_"+status.id, status)
		return {
			...state,
			status
		}
		case COURSE_END:
		status = {...state.status}
		status.started = false
		status.paused  = false
		storage.store("STATUS_"+status.id, status)
		return {
			...state,
			status
		}
		case COURSE_TICK:
		status = {...state.status}
		if (status.started && !status.paused) {
			status.duration--
			storage.store("STATUS_"+status.id, status)
			return {
				...state,
				status
			}
		} else {
			return state
		}
		case COURSE_STARTING_TICK:
		status = {...state.status}
		status.waiting -= 1000;			
		return {
			...state,
			status
		}

		case GIFT_UPDATE:
		students = [...state.students]
		let gifts = action.data
		if (students) {
			for(let i=0,len=students.length;i<len;i++) {
				let item = students[i]
				for(let j=0,jlen=gifts.length;j<jlen;j++) {
					let gift = gifts[j]
					if (gift.to_id == item.id) {
						item.gift_total = gift.total
						break
					}
				}
			}
		}
		return {
			...state,
			students
		}
		case PROGRESS_UPDATE:
		students = [...state.students]
		let percent = action.percent,
			sid     = action.id
		if (students) {
			if (percent == 100) {
				let found = null, rank = 1
				for(let i=0,len=students.length;i<len;i++) {
					let item = students[i]
					if (item.id == sid) {
						item.percent = percent
						found = item
					} else if (item.progress_rank) {
						rank++
					}
				}
				if (found) {
					found.progress_rank = rank
				}
			} else {
				for(let i=0,len=students.length;i<len;i++) {
					let item = students[i]
					if (item.id == sid) {
						item.percent = percent
						break
					}
				}
			}
		}
		return {
			...state,
			students
		}
		case PROGRESS_RESET:
		students = [...state.students]
		if (students) {
			for(let i=0,len=students.length;i<len;i++) {
				let item = students[i]
				item.progress_rank = null
				item.percent = null
			}
		}
		return {
			...state,
			students
		}
		default:
		return state
	}
}

export default room