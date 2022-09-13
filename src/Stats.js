/*
import React from 'react';

class Stats extends React.Component {
    //indexSymbol = this.props.indexSymbol;

    findBestInRow = (row, type) => {
        let best = row[this.props.indexSymbol + "_value" + type];
        let bestName = this.props.indexSymbol + "_value";
        if (row[this.props.indexSymbol + "_valueLev2" + type] > best){
            best = row[this.props.indexSymbol + "_valueLev2" + type];
            bestName = this.props.indexSymbol + "_valueLev2";
        }
        if (row[this.props.indexSymbol + "_valueLev3" + type] > best){
            best = row[this.props.indexSymbol + "_valueLev3" + type];
            bestName = this.props.indexSymbol + "_valueLev3";
        }
        if (row[this.props.indexSymbol + "_valueLev4" + type] > best){
            bestName = this.props.indexSymbol + "_valueLev4";
        }
        //console.log(bestName + type);
        return bestName + type;
    }
    render() {
        let round = this.props.round;
        let indexSymbol = this.props.indexSymbol;
        return (
            <div className="stats-container">
                <div className="stats-title">{indexSymbol} Returns Data {this.props.firstYear}-{this.props.lastYear}</div>
                <div className="stats-grand-titles">
                    <div className="stats-grand-title-1">{indexSymbol} Returns</div>
                    <div className="stats-separator"></div>
                    <div className="stats-grand-title-2">{indexSymbol} X2 Simulated</div>
                    <div className="stats-separator"></div>
                    <div className="stats-grand-title-3">{indexSymbol} X3 Simulated</div>
                    <div className="stats-separator"></div>
                    <div className="stats-grand-title-4">{indexSymbol} X4 Simulated</div>
                </div>
                <div className="stats-row-title">
                    <div className="stats-year">#Years</div>
                    <div className="stats-separator"></div>
                    <div className="stats-avg">Average</div>
                    <div className="stats-min">Minimun</div>
                    <div className="stats-max">Maximum</div>
                    <div className="stats-separator"></div>
                    <div className="stats-avg">Average</div>
                    <div className="stats-min">Minimun</div>
                    <div className="stats-max">Maximum</div>
                    <div className="stats-separator"></div>
                    <div className="stats-avg">Average</div>
                    <div className="stats-min">Minimun</div>
                    <div className="stats-max">Maximum</div>
                    <div className="stats-separator"></div>
                    <div className="stats-avg">Average</div>
                    <div className="stats-min">Minimun</div>
                    <div className="stats-max">Maximum</div>
                </div>
                {this.props.stats.map((stat, key) => {
                    let bestAvg = this.findBestInRow(stat, "Avg");
                    let bestMin = this.findBestInRow(stat, "Min");
                    let bestMax = this.findBestInRow(stat, "Max");

                    return <div className="stats-row" key={"year-range-" + key}>
                        <div className="stats-year">{key}</div>
                        <div className="stats-separator"></div>
                        <div className={"stats-avg" + (bestAvg === indexSymbol + "_valueAvg" ? " best" : "")}>{round(stat[indexSymbol + "_valueAvg"], 2)}%</div>
                        <div className={"stats-min" + (bestMin === indexSymbol + "_valueMin" ? " best" : "")}>{round(stat[indexSymbol + "_valueMin"], 2)}%</div>
                        <div className={"stats-max" + (bestMax === indexSymbol + "_valueMax" ? " best" : "")}>{round(stat[indexSymbol + "_valueMax"], 2)}%</div>
                        <div className="stats-separator"></div>
                        <div className={"stats-avg" + (bestAvg === indexSymbol + "_valueLev2Avg" ? " best" : "")}>{round(stat[indexSymbol + "_valueLev2Avg"], 2)}%</div>
                        <div className={"stats-min" + (bestMin === indexSymbol + "_valueLev2Min" ? " best" : "")}>{round(stat[indexSymbol + "_valueLev2Min"], 2)}%</div>
                        <div className={"stats-max" + (bestMax === indexSymbol + "_valueLev2Max" ? " best" : "")}>{round(stat[indexSymbol + "_valueLev2Max"], 2)}%</div>
                        <div className="stats-separator"></div>
                        <div className={"stats-avg" + (bestAvg === indexSymbol + "_valueLev3Avg" ? " best" : "")}>{round(stat[indexSymbol + "_valueLev3Avg"], 2)}%</div>
                        <div className={"stats-min" + (bestMin === indexSymbol + "_valueLev3Min" ? " best" : "")}>{round(stat[indexSymbol + "_valueLev3Min"], 2)}%</div>
                        <div className={"stats-max" + (bestMax === indexSymbol + "_valueLev3Max" ? " best" : "")}>{round(stat[indexSymbol + "_valueLev3Max"], 2)}%</div>
                        <div className="stats-separator"></div>
                        <div className={"stats-avg" + (bestAvg === indexSymbol + "_valueLev4Avg" ? " best" : "")}>{round(stat[indexSymbol + "_valueLev4Avg"], 2)}%</div>
                        <div className={"stats-min" + (bestMin === indexSymbol + "_valueLev4Min" ? " best" : "")}>{round(stat[indexSymbol + "_valueLev4Min"], 2)}%</div>
                        <div className={"stats-max" + (bestMax === indexSymbol + "_valueLev4Max" ? " best" : "")}>{round(stat[indexSymbol + "_valueLev4Max"], 2)}%</div>
                    </div>
                })}
            </div>
        )
    }
}

export default Stats
*/