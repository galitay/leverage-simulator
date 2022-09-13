/*
import React from 'react';
import moment from 'moment';
import { AreaChart, Area, YAxis, XAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import LoadingAnimation from './LoadingAnimation';
import YearPicker from './YearPicker';

class Chart extends React.Component {
    symbols = ["SPXX3", "SPXX2"];
    allSymbols = this.props.indexSymbols;
    allData = [];
    returnStats = [];
    state = {
        allYearsChartData: [],
        dataLoaded: false,
        chartData: [],
        tradingDaysPerYear: new Map(),
        returnStats: [],
        statsToPresentInUI: [],
        firstYear: 0,
        lastYear: 0,
        selectedStartDate: 0,
        selectedEndDate: 0,
    }

    // -------------------- Stats --------------------
    calculateAnnualReturn = (endingValue, beginningValue, years) => {
        let _return = (endingValue - beginningValue) / beginningValue;
        return (Math.pow(1 + _return, 1 / years) - 1) * 100;
    }

    calculateAllAnnualReturns = (data, years, levSymbol, shortestPeriod, longestPeriod) => {
        let firstYear = years[0];
        let lastYear = years[years.length - 1];
        let daysPerYear = 252;

        this.returnStats = [];

        //console.log(years);
        for (var i = shortestPeriod; i < longestPeriod + 1; i++) {
            let period = i;
            if (period > lastYear - firstYear) {
                continue;
            }

            years.forEach((periodEndYear) => {
                if (period < periodEndYear - firstYear && periodEndYear < lastYear) {
                    if (data[(periodEndYear - firstYear - period) * daysPerYear] && data[(periodEndYear - firstYear) * daysPerYear]) {
                        let beginningValue = data[(periodEndYear - firstYear - period) * daysPerYear][levSymbol];
                        let endingValue = data[(periodEndYear - firstYear) * daysPerYear][levSymbol];
                        let annualReturn = this.calculateAnnualReturn(endingValue, beginningValue, period);
                        if (!this.returnStats[period]) {
                            this.returnStats[period] = [];
                        }
                        this.returnStats[period].push(annualReturn);
                    }
                }
            })
        }

        //console.log(this.returnStats);

        let stats = [];
        this.returnStats.forEach((periodStats, key) => {
            let sum = 0;
            let min = 1000;
            let max = -1000;
            let length = periodStats.length;
            periodStats.forEach((annualReturn) => {
                sum += annualReturn;
                if (annualReturn < min) {
                    min = annualReturn;
                }
                if (annualReturn > max) {
                    max = annualReturn;
                }
            });
            stats = this.state.statsToPresentInUI;

            if (!stats[key]) {
                stats[key] = [];
            }
            stats[key][levSymbol + "Min"] = min;
            stats[key][levSymbol + "Max"] = max;
            stats[key][levSymbol + "Avg"] = sum / length;
            this.setState({ statsToPresentInUI: stats });

        })
        this.props.setStats(stats);
    }
    // -----------------------------------------------


    countTradingDaysPerYear = (date) => {
        let year = moment(date).year();
        let strDate = moment(date).format('YYYY-MM-DD');
        let tradingDaysPerYear = this.state.tradingDaysPerYear;
        if (tradingDaysPerYear.has(year)) {
            let current = tradingDaysPerYear.get(year);
            if (!current.allDays.has(strDate)) {
                current.allDays.set(strDate, 1);
                current.lastDay = date;
                tradingDaysPerYear.set(year, current);
            }
        }
        else {
            let allDays = new Map();
            allDays.set(strDate, 1);
            tradingDaysPerYear.set(year, { allDays: allDays, firstDay: date, lastDay: null });
        }

        this.setState({ tradingDaysPerYear: tradingDaysPerYear });
    }

    saveToLocalStorage = (data) => {
        localStorage.setItem("data", JSON.stringify(data));
    }

    loadFromLocalStorage = () => {
        let localStorageData = localStorage.getItem("data");
        return JSON.parse(localStorageData);
    }

    reduceChartDataDensity = (chartData, maxDensity) => {
        if (chartData.length < maxDensity) {
            return chartData;
        }
        let scale = Math.round(chartData.length / maxDensity);

        let newChartData = [];
        for (var i = 0; i < chartData.length; i++) {
            if (i % scale === 0) {
                newChartData.push(chartData[i]);
            }
        }
        return newChartData;
    }
    handleDataLoaded = (stocksData, saveToLocal) => {
        if (saveToLocal) {
            this.saveToLocalStorage(stocksData);
        }
        this.allData = this.buildDataForChart(stocksData, this.allSymbols);
        let chartData = this.getDataToPresent(this.allData, this.allSymbols);
        this.setState({ allYearsChartData: structuredClone(chartData) });
        this.normalizeAndCalculateReturns(chartData, this.symbols);
        this.setState({ dataLoaded: true });
    }

    normalizeAndCalculateReturns = (data, symbols) => {
        let chartData = this.normalizeData(data, symbols, this.props.indexSymbol);
        this.setState({ chartData: chartData });
        let defaultMaxRange = 51;
        let yearsRange = this.state.lastYear - this.state.firstYear
        let yearsSpan = defaultMaxRange;
        if (yearsRange > 1){
            yearsSpan = Math.min(defaultMaxRange, yearsRange);
        }
     
        let yearsToCalculate = [];
        [...this.state.tradingDaysPerYear.keys()].map(year => {
            if (year >= this.state.firstYear && year <= this.state.lastYear) {
                yearsToCalculate.push(year);
            }
            return 0;
        })
        console.log(yearsToCalculate);
        this.allSymbols.forEach(symbol => {
            this.calculateAllAnnualReturns(this.allData, yearsToCalculate, symbol + "_value", 1, yearsSpan);
            this.calculateAllAnnualReturns(this.allData, yearsToCalculate, symbol + "_valueLev2", 1, yearsSpan);
            this.calculateAllAnnualReturns(this.allData, yearsToCalculate, symbol + "_valueLev3", 1, yearsSpan);
            this.calculateAllAnnualReturns(this.allData, yearsToCalculate, symbol + "_valueLev4", 1, yearsSpan);
        });
    }

    getStocksData = () => {
        let localStocksData = this.loadFromLocalStorage();
        if (localStocksData) {
            this.handleDataLoaded(localStocksData, false);
            return;
        }

        const apiUrl = "https://www.itayg.com/leverage/stocksApi.php";

        fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((res) => res.json())
            .then(
                (stocksData) => {
                    this.handleDataLoaded(stocksData, true);
                },
                (error) => {
                    console.log("Error: " + error);
                }
            );
    }

    findMultiplier(chartData, symbol, mainSymbol) {
        let multiplier = 1;
        try {
            chartData.forEach((item) => {
                if (item[symbol] !== 0) {
                    multiplier = item[mainSymbol] / item[symbol];
                    throw this.BreakException;
                }
            });
        } catch (e) {
            if (e !== this.BreakException) throw e;
        }
        return multiplier;
    }

    normalizeData(chartData, symbols, mainSymbol, useLog) {
        let multipliers = [];
        symbols.forEach((symbol) => {
            multipliers[symbol] = this.findMultiplier(chartData, symbol, mainSymbol);
        });

        chartData = this.reduceChartDataDensity(chartData, 1500);

        chartData.forEach((item) => {
            symbols.forEach((symbol) => {
                item[symbol] = item[symbol] * multipliers[symbol];
            });
        });

        if (useLog) {
            chartData.forEach((item) => {
                item[mainSymbol] = Math.log10(item[mainSymbol]);
                symbols.forEach((symbol) => {
                    item[symbol] = Math.log10(item[symbol]);
                });
            });
        }

        //console.log(chartData);

        return chartData;
    }

    getDataToPresent = (allData, allSymbols) => {
        if (!allData || allData.lenght === 0) {
            return [];
        }
        let chartData = [];
        allData.forEach((row) => {
            let newObj = [];
            newObj["date"] = row.date;
            allSymbols.forEach(symbol => {
                newObj[symbol] = row[symbol + "_value"];
                newObj[symbol + "X2"] = row[symbol + "_valueLev2"];
                newObj[symbol + "X3"] = row[symbol + "_valueLev3"];
            })
            newObj["TQQQ"] = row["NDX_valueLev3Real"];
            chartData.push(newObj);
        });

        return chartData;
    }

    dailyFee = (annualFee, date) => {
        let year = moment(date).year();
        return this.getAnnualFeeFraction(annualFee, year) / this.getTradingDaysPerYear(year);
    }

    getAnnualFeeFraction = (annualFee, year) => {
        if (!this.state.tradingDaysPerYear.has(year)) {
            return annualFee; // default
        }
        let yearData = this.state.tradingDaysPerYear.get(year);
        let res = annualFee * (moment(yearData.lastDay).diff(moment(yearData.firstDay), 'days') / 365);
        // console.log(year + " - Annual Fee is " + annualFee + " and fraction is " + res);
        return res;
    }

    getTradingDaysPerYear = (year) => {
        if (!this.state.tradingDaysPerYear.has(year)) {
            return 252; // default
        }
        let yearData = this.state.tradingDaysPerYear.get(year);
        return yearData.allDays.size;
    }


    buildDataForChart = (stocksData, symbols) => {
        let data = [];
        let prevRow = null;
        let annualFee = 0.0095;
        let startWith = 1000;
        let firstYear = 0;
        let lastYear = 0;
        stocksData.forEach(row => {
            this.countTradingDaysPerYear(moment(row["date"]));
            if (firstYear === 0 || firstYear > moment(row["date"]).year()) {
                firstYear = moment(row["date"]).year();
            }
            if (lastYear === 0 || lastYear < moment(row["date"]).year()) {
                lastYear = moment(row["date"]).year();
            }
        });
        this.props.setYearsRange(firstYear, lastYear, firstYear, lastYear);
        this.setState({ firstYear: firstYear, lastYear: lastYear, selectedStartDate: firstYear, selectedEndDate: lastYear });
        stocksData.forEach(row => {
            let dailyFee = this.dailyFee(annualFee, row["date"]);

            if (prevRow != null) {
                symbols.forEach(symbol => {
                    let lev1 = 1;
                    if (prevRow[symbol] && prevRow[symbol] != 0) {
                        lev1 = row[symbol] / prevRow[symbol];
                    }
                    let lev2 = ((lev1 - 1) * 2) + 1;
                    let lev3 = ((lev1 - 1) * 3) + 1;
                    let lev4 = ((lev1 - 1) * 4) + 1;
                    let realLevPrecentage = 1;
                    if (prevRow["TQQQ"] && prevRow["TQQQ"] != 0) {
                        realLevPrecentage = row["TQQQ"] / prevRow["TQQQ"];
                    }
                    row[symbol + "_value"] = lev1 * prevRow[symbol + "_value"];
                    row[symbol + "_valueLev2"] = (lev2 - dailyFee) * prevRow[symbol + "_valueLev2"];
                    row[symbol + "_valueLev3"] = (lev3 - dailyFee) * prevRow[symbol + "_valueLev3"];
                    row[symbol + "_valueLev4"] = (lev4 - dailyFee) * prevRow[symbol + "_valueLev4"];
                    row[symbol + "_valueLev3Real"] = realLevPrecentage * prevRow[symbol + "_valueLev3Real"];
                })
            }
            else {
                symbols.forEach(symbol => {
                    row[symbol + "_value"] = startWith;
                    row[symbol + "_valueLev2"] = startWith;
                    row[symbol + "_valueLev3"] = startWith;
                    row[symbol + "_valueLev4"] = startWith;
                    row[symbol + "_valueLev3Real"] = startWith;
                })
            }
            data.push(row);
            prevRow = row;
        })

        this.setState({ data: data });
        return data;
    }

    componentDidMount() {
        this.getStocksData();
    }

    updateDates = (year, type) => {
        //let year = e.target.value;
        if (type === "start") {
            this.setState({ firstYear: year });
        }
        else {
            this.setState({ lastYear: year });
        }
        setTimeout(() => {
            let newStartLimit = moment(this.state.firstYear + "-01-01");
            let newEndLimit = moment((this.state.lastYear + 1) + "-01-01");
            let cloneData = structuredClone(this.state.allYearsChartData);
            let newChartData = [];
            cloneData.forEach(row => {
                let curDate = moment(row["date"]);
                if (curDate > newStartLimit && curDate < newEndLimit) {
                    newChartData.push(row);
                }
            })
            this.normalizeAndCalculateReturns(newChartData, this.symbols);
        }, 100);
    }

    setRange = (year, type) => {
        if (type === "first") {
            this.setState({ selectedStartDate: year });
            this.props.setYearsRange(this.state.firstYear, this.state.lastYear, year, this.state.selectedEndDate);
        }
        else {
            this.setState({ selectedEndDate: year });
            this.props.setYearsRange(this.state.firstYear, this.state.lastYear, this.state.selectedStartDate, year);
        }
    }

    render() {
        return (
            <div className="chart-container">
                <div className="indices-chart-container">
                    {this.state.tradingDaysPerYear.size > 0 ?
                        <div className="years-picker-container">
                            <YearPicker
                                range={[...this.state.tradingDaysPerYear.keys()]}
                                selected={[...this.state.tradingDaysPerYear.keys()][0]}
                                type="start"
                                update={this.updateDates} />
                            <YearPicker
                                range={[...this.state.tradingDaysPerYear.keys()]}
                                selected={[...this.state.tradingDaysPerYear.keys()][[...this.state.tradingDaysPerYear.keys()].length - 1]}
                                type="end"
                                update={this.updateDates} />
                        </div>
                        : null}

                    {this.state.dataLoaded ?
                        <ResponsiveContainer width="100%" height={600}>
                            <AreaChart data={this.state.chartData} margin={{ top: 10, right: 0, left: 0, bottom: 10 }}>
                                <defs>
                                    <linearGradient id="colorBaseIndex" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0083C4" stopOpacity={0.7} />
                                        <stop offset="95%" stopColor="#0083C4" stopOpacity={0.5} />
                                    </linearGradient>
                                    <linearGradient id="colorNDX3" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00C492" stopOpacity={0.7} />
                                        <stop offset="95%" stopColor="#00C492" stopOpacity={0.5} />
                                    </linearGradient>
                                    <linearGradient id="colorNDX2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#53B683" stopOpacity={0.7} />
                                        <stop offset="95%" stopColor="#80B499" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend verticalAlign="top" height={10} />
                                <Area type="monotone" name={this.props.indexSymbol} dataKey={this.props.indexSymbol} stroke="#0083C4" fillOpacity={0.3} fill={"url(#colorBaseIndex)"} />
                                <Area type="monotone" name={"Simulated " + this.props.indexSymbol + " X2"} dataKey={this.props.indexSymbol + "X2"} stroke="#80B499" fillOpacity={0.3} fill={"url(#colorNDX2)"} />
                                <Area type="monotone" name={"Simulated " + this.props.indexSymbol + " X3"} dataKey={this.props.indexSymbol + "X3"} stroke="#00C492" fillOpacity={0.3} fill={"url(#colorNDX3)"} />
                            </AreaChart>
                        </ResponsiveContainer>
                        : <div className="indices-chart-loading-container">
                            Loading Data
                            <LoadingAnimation insideComponent={true} />
                        </div>}
                </div>
            </div>
        )
    }
}
export default Chart
*/