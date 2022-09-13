import React from 'react';

class YearPicker extends React.Component {
    state = {
        range: this.props.range,
        type: this.props.type,
    }

    toggle(){
        if (this.props.openDatePicker === this.props.type) {
            this.props.setOpenDatePicker("");
        }
        else{
            this.props.setOpenDatePicker(this.state.type);
        }
    }

    update = (year) => {
        this.props.update(year, this.state.type);
        this.props.setOpenDatePicker("");
    }

    render() {
        return (
            <div className="year-picker-container">
                <div className="selected-year-title" onClick={() => this.toggle()}>{this.props.selected}</div>
                {this.props.openDatePicker === this.props.type ? 
                <div className="options-container">
                    {this.state.range.map(year => {
                        return <div className={"year-picker-item" + (parseInt(this.props.selected) === parseInt(year) ? " selected" : "")} 
                                    onClick={() => this.update(year, this.state.type)}
                                    key={"year-op-" + this.state.type + "-" + year}>{year}</div>
                    })}
                </div>
                : null
                }
            </div>
        )
    }
}

export default YearPicker