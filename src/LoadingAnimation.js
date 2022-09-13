import React from 'react';

class LoadingAnimation extends React.Component {
    render(){
        return (
            <div className={this.props.insideComponent ? "loading-animation-inside-component" : "loading-animation-container"}>
               <div className="multi-spinner-container">
                    <div className="multi-spinner">
                        <div className="multi-spinner">
                            <div className="multi-spinner">
                            <div className="multi-spinner">
                                    <div className="multi-spinner">
                                        <div className="multi-spinner"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default LoadingAnimation