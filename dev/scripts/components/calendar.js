import React from 'react'
import PropTypes from 'prop-types'

class Calendar extends React.Component {
	constructor(props) {
		super(props)
		this.$now  = new Date()
		this.$week_txt = ['日', '一', '二', '三', '四', '五', '六']
		this.$data = {}
		this.state = {}
	}

	componentDidMount() {
		this.__init()
		this.__calculate_month()
		this.__on_pick_date()
	}

	__fn_ (n){
	  	n = n.toString()
		return n[1] ? n : '0' + n
	}
  
	__is_sameday(prev, next) {
	  return prev.year == next.year && 
			 prev.month == next.month && 
			 prev.day == next.day
	}
  
	__is_small_eq_than(source, target) {
		source = new Date(source.year,source.month-1,source.day)
		target = new Date(target.year,target.month-1,target.day)
		return source.getTime() - target.getTime() >= 0
	}
  
	__date_to_obj(date) {
		return {
			year: date.getFullYear(),
			month: date.getMonth() + 1,
			day: date.getDate(),
			week: date.getDay()
		}
	}
  
	__is_disabled(date) {
		for (let j = 0, len = this.$data.disabled.length; j < len; j++) {
			if (this.__is_sameday(this.$data.disabled[j], date)) {
				return true
			}
		}
	}
  
	__is_highlighted(date) {
		for (let j = 0, len = this.$data.highlighted.length; j < len; j++) {
			if (this.__is_sameday(this.$data.highlighted[j], date)) {
				return true
			}
		}
	}
  
	__init() {
		let data = {}
		data.today 			= this.__date_to_obj(this.$now)
		data.disabled 		= []
		data.highlighted 	= []
		data.cursor 		= data.today
		data.validDays 		= 365
		this.$data 			= data
		this.props.onChangeMonth(data.cursor)
	}
  
	__calculate_month() {
		if (this.$data.choosed && this.__is_disabled(this.$data.choosed)) {
			this.$data.choosed = null
			this.$data.choosed_txt = null
		}
		let cursor = this.$data.cursor
		cursor = this.__date_to_obj(new Date(cursor.year, cursor.month - 1, 1))
		let first = 1-cursor.week
		let lastDay = 28, temp = cursor.month
		while (temp == cursor.month) {
			lastDay++
			temp = new Date(cursor.year, cursor.month - 1, lastDay).getMonth() + 1
		}
		lastDay--
		let lastWeek = new Date(cursor.year, cursor.month - 1, lastDay).getDay()
		let last = lastDay + 6 - lastWeek, result = []
		for(let i=first;i<=last;i++) {
			let data = this.__date_to_obj(new Date(cursor.year,cursor.month-1,i))
			let disabled = this.__is_disabled(data)
			if (!disabled) {
				if (!this.$data.choosed) {
					if (this.__is_sameday(data, this.$data.today)) {
						data.choosed = true
						this.$data.choosed = data
					}
				} else {
					if (this.__is_sameday(data, this.$data.choosed)) {
						data.choosed = true
					}
				}
				data.highlighted = this.__is_highlighted(data)
			}
			data.disabled = disabled
			if (data.month == cursor.month) {
				result.push(data)
			} else {
				result.push({})
			}
		}
		this.$data.days = result
		let rows = [], current = []
		result.forEach((item, index)=>{
			if (index % 7 == 0 && index != 0) {
			rows.push(current)
			current = []
			}
			item.index = index
			current.push(item)
		})
		rows.push(current)
		this.$data.rows = rows
		this.setState(this.$data)
	}

	__on_pick_date() {
		let choosed = this.$data.choosed
		if (choosed) {
			let choosed_txt = {
				year: choosed.year,
				month: this.__fn_(choosed.month),
				day: this.__fn_(choosed.day),
				week: this.$week_txt[choosed.week]
			}
			this.props.onPickDate({
				choosed, choosed_txt
			})
		}
	}
  
	strToDate(str) {
		let parsed = str.split(/[-: ]/)
		parsed = parsed.concat([0,0,0,0,0,0])
		return new Date(parsed[0], parsed[1] - 1, parsed[2], parsed[3], parsed[4], parsed[5])
	}
  
	setChoosed(obj) {
		this.$data.choosed = obj
		this.$data.days.forEach((item, index) => {
			if (item.choosed) {
				item.choosed = false
			}
			if (this.__is_sameday(item,obj)) {
				item.choosed = true
			}
		})
		this.setState(this.$data)
	}
  
	onNextMonth() {
		let cursor = this.$data.cursor
		cursor = this.__date_to_obj(new Date(cursor.year,cursor.month,1))
		this.$data.cursor = cursor
		this.__calculate_month()
		this.props.onChangeMonth(cursor)
	}
  
	onPrevMonth() {
		let cursor = this.state.cursor
		cursor = this.__date_to_obj(new Date(cursor.year, cursor.month-2, 1))
		this.$data.cursor = cursor
		this.__calculate_month()
		this.props.onChangeMonth(cursor)
	}
  
	setDisabled(dates) {
		let result = []
		dates.forEach((item)=>{
			let date = this.__date_to_obj(this.strToDate(item))
			result.push(date)
		})
		this.$data.disabled = result
		this.__calculate_month()
	}
  
	setHighlighted(dates) {
	  	let result = []
		dates.forEach((item) => {
			let date = this.__date_to_obj(this.strToDate(item))
			result.push(date)
		})
		this.$data.highlighted = result
		this.__calculate_month()
	}

	onPickDate(index) {
		this.setChoosed(this.state.days[index])
		this.__on_pick_date()
	}
  
	render() {
		return (this.state.cursor ? 
		<div id="calendar-box" className='calendar-box'>
			<div className='calendar-control cal-bd'>
				<div className='control-l' onClick={this.onPrevMonth.bind(this)}>
					<img src={require('../../assets/calendar-arrow.png')}/>
				</div>
				<div className='control-c'>{this.state.cursor.month}月 {this.state.cursor.year}年</div>
				<div className='control-r' onClick={this.onNextMonth.bind(this)}>
					<img src={require('../../assets/calendar-arrow.png')}/>
				</div>
			</div>
			<div className='calendar-head cal-bd'>
				<span className='highlight'>日</span>
				<span>一</span>
				<span>二</span>
				<span>三</span>
				<span>四</span>
				<span>五</span>
				<span className='highlight'>六</span>
			</div>
			{this.state.rows.map((row, rowIndex)=>(
				<div key={rowIndex} className='calendar-row cal-bd'>
					{
						row.map((item, index)=>(
							item.disabled ? <div key={index} className='calendar-col disabled'>{item.day}</div> :
							item.choosed  ? <div key={index} className='calendar-col selected'>{item.day}</div> :
							item.highlighted ? <div key={index} className='calendar-col highlighted' onClick={()=>{
								let _index = rowIndex * row.length + index
								this.onPickDate(_index)
							}}>{item.day}</div> :
							!item.day ? <div key={index} className='calendar-col'></div> :
							<div key={index} className='calendar-col' onClick={()=>{
								let _index = rowIndex * row.length + index
								this.onPickDate(_index)
							}}>{item.day}</div>
						))
					}
				</div>
			))}
		</div> : "")
	}
}
  
Calendar.propTypes = {
	onPickDate    : PropTypes.func.isRequired,
	onChangeMonth : PropTypes.func.isRequired
}
export default Calendar