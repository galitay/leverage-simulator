import React from 'react';
import './App.css';
import moment from 'moment';
import LoadingAnimation from './LoadingAnimation';
import YearPicker from './YearPicker';
import { AreaChart, Area, YAxis, XAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const initState = {
  statsToPresent: [],
  indexSymbols: ["SPX", "NDX"],
  symbolsText: {"SPX": "S&P 500 (SPX)", "NDX": "Nasdaq 100 (NDX)"},
  selectedIndexSymbol: "NDX",
  firstYear: 0,
  lastYear: 0,
  selectedFirstYear: 0,
  selectedLastYear: 0,

  allYearsChartData: [],
  dataLoaded: false,
  chartData: [],
  tradingDaysPerYear: new Map(),
  selectedStartDate: 0,
  selectedEndDate: 0,

  initialCapital: 1000,
  investPerMonth: 0,

  openDatePicker: ""
}


class App extends React.Component {

  allData = [];
  state = initState;

  recalculate = () => {
    this.setState({dataLoaded: false});
    setTimeout(() => {
      this.handleDataLoaded(this.loadFromLocalStorage(), false, true);
    }, 500);
  }

  setInitialCapital = (capital) => {
    this.setState({initialCapital: capital});
  }

  setInvestPerMonth = (invest) => {
    this.setState({investPerMonth: invest});
  }

  setOpenDatePicker = (type) => {
    this.setState({openDatePicker: type});
  }

  setYearsRange = (first, last, selectedFirst, selectedLast) => {
    this.setState({ firstYear: first, lastYear: last, selectedFirstYear: selectedFirst, selectedLastYear: selectedLast });
  }

  setSelectedIndex = (symbol) => {
    this.setState({ selectedIndexSymbol: symbol });
    this.updateDates(0, "");
  }

  numberWithCommas(x) {
    x = Math.round(x);
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  round = (num, digits) => {
    let helper = 1;
    for (var i = 0; i < digits; i++) {
      helper *= 10;
    }
    return Math.round(num * helper) / helper;
  }

  // -------------------- Stats --------------------
  calculateAnnualReturn = (endingValue, beginningValue, years) => {
    let _return = (endingValue - beginningValue) / beginningValue;
    return (Math.pow(1 + _return, 1 / years) - 1) * 100;
  }

  calculateAllAnnualReturns = (data, years, levSymbol, shortestPeriod, longestPeriod, stats) => {
    let firstYear = years[0];
    let lastYear = years[years.length - 1];
    let daysPerYear = 252;
    let returnStats = [];

    for (var i = shortestPeriod; i < longestPeriod + 1; i++) {
      let period = i;
      if (period > lastYear - firstYear) {
        continue;
      }

      years.forEach((periodEndYear) => {
        if (period <= periodEndYear - firstYear && periodEndYear <= lastYear) {
          if (data[(periodEndYear - firstYear - period) * daysPerYear] && data[(periodEndYear - firstYear) * daysPerYear]) {
            let beginningValue = data[(periodEndYear - firstYear - period) * daysPerYear][levSymbol];
            let endingValue = data[(periodEndYear - firstYear) * daysPerYear][levSymbol];
            let annualReturn = this.calculateAnnualReturn(endingValue, beginningValue, period);
            if (!returnStats[period]) {
              returnStats[period] = [];
            }
            returnStats[period].push(annualReturn);
          }
        }
      })
    }

    returnStats.forEach((periodStats, key) => {
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

      if (!stats[key]) {
        stats[key] = [];
      }
      stats[key][levSymbol + "Min"] = min;
      stats[key][levSymbol + "Max"] = max;
      stats[key][levSymbol + "Avg"] = sum / length;

    });
    return stats;
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
  handleDataLoaded = (stocksData, saveToLocal, keepUiState) => {
    if (saveToLocal) {
      this.saveToLocalStorage(stocksData);
    }
    this.allData = this.buildDataForChart(stocksData, this.state.indexSymbols, keepUiState);
    let chartData = this.getDataToPresent(this.allData, this.state.indexSymbols);
    this.setState({ allYearsChartData: structuredClone(chartData) });
    this.normalizeAndCalculateReturns(chartData);
    this.setState({ dataLoaded: true });
  }

  filterRelevenatDataForSelectedDates = (data) => {
    let dataInRange = [];
    let startLimit = moment(this.state.firstYear + "-01-01");
    let endLimit = moment((this.state.lastYear + 1) + "-01-01");
    data.forEach(row => {
      let curDate = moment(row["date"]);
      if (curDate >= startLimit && curDate <= endLimit) {
        dataInRange.push(row);
      }
    })
    return dataInRange
  }

  normalizeAndCalculateReturns = (data) => {
    setTimeout(() => {
      let symbolsToNormalize = [this.state.selectedIndexSymbol + "X2", this.state.selectedIndexSymbol + "X3", this.state.selectedIndexSymbol + "X4", "TQQQ"];
      let chartData = this.normalizeData(data, symbolsToNormalize, this.state.selectedIndexSymbol);
      this.setState({ chartData: chartData });
      let defaultMaxRange = 51;
      let yearsRange = this.state.lastYear - this.state.firstYear
      let yearsSpan = defaultMaxRange;
      if (yearsRange > 1) {
        yearsSpan = Math.min(defaultMaxRange, yearsRange);
      }

      let yearsToCalculate = [];
      [...this.state.tradingDaysPerYear.keys()].map(year => {
        if (year >= this.state.firstYear && year <= this.state.lastYear) {
          yearsToCalculate.push(year);
        }
      });
      let dataInRangeForStats = this.filterRelevenatDataForSelectedDates(this.allData);
      let stats = [];
      this.state.indexSymbols.forEach(symbol => {
        stats = this.calculateAllAnnualReturns(dataInRangeForStats, yearsToCalculate, symbol + "_value", 1, yearsSpan, stats);
        stats = this.calculateAllAnnualReturns(dataInRangeForStats, yearsToCalculate, symbol + "_valueLev2", 1, yearsSpan, stats);
        stats = this.calculateAllAnnualReturns(dataInRangeForStats, yearsToCalculate, symbol + "_valueLev3", 1, yearsSpan, stats);
        stats = this.calculateAllAnnualReturns(dataInRangeForStats, yearsToCalculate, symbol + "_valueLev4", 1, yearsSpan, stats);
      });
      this.setState({ statsToPresent: stats });
    }, 30);
  }

  mergeStats = (stats , newStats) => {
    newStats.forEach((period, key) => {
      period.forEach((v, k) =>{
        stats[key][k] = v;
      });
      
    });
    return stats;
  }

  getStocksData = () => {
    let localStocksData = this.loadFromLocalStorage();
    if (localStocksData) {
      this.handleDataLoaded(localStocksData, false, false);
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
          this.handleDataLoaded(stocksData, true, false);
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

  findPercentageMultiplier(chartData, symbol) {
    let multiplier = 1;
    try {
      chartData.forEach((item) => {
        if (item[symbol] !== 0) {
          multiplier = 1 / item[symbol];
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

    // normalize all leverages to start with the same number
    chartData.forEach((item) => {
      symbols.forEach((symbol) => {
        item[symbol] = item[symbol] * multipliers[symbol];
      });
    });

    // ops on symbols including main symbol
    symbols.push(mainSymbol);
    let usePercentage = true;
    if (usePercentage) {
      let percentageMultipliers = [];
      symbols.forEach((symbol) => {
        percentageMultipliers[symbol] = this.findPercentageMultiplier(chartData, symbol);
      });
      chartData.forEach((item) => {
        symbols.forEach((symbol) => {
          item[symbol] = this.round((item[symbol] * percentageMultipliers[symbol] * 100) - 100, 2);
        });
      });
    }

    if (useLog) {
      chartData.forEach((item) => {
        item[mainSymbol] = Math.log10(item[mainSymbol]);
        symbols.forEach((symbol) => {
          item[symbol] = Math.log10(item[symbol]);
        });
      });
    }

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
        if (row[symbol + "_value"] === 0) {
          newObj[symbol] = 0;
          newObj[symbol + "X2"] = 0;
          newObj[symbol + "X3"] = 0;
          newObj[symbol + "X4"] = 0;
        }
        else {
          newObj[symbol] = row[symbol + "_value"];
          newObj[symbol + "X2"] = row[symbol + "_valueLev2"];
          newObj[symbol + "X3"] = row[symbol + "_valueLev3"];
          newObj[symbol + "X4"] = row[symbol + "_valueLev4"];
        }

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
    return res;
  }

  getTradingDaysPerYear = (year) => {
    if (!this.state.tradingDaysPerYear.has(year)) {
      return 252; // default
    }
    let yearData = this.state.tradingDaysPerYear.get(year);
    return yearData.allDays.size;
  }

  isNewMonth(current, prev){
    return moment(current).month() !== moment(prev).month();
  }

  buildDataForChart = (stocksData, symbols, keepUiState) => {
    let data = [];
    let prevRow = null;
    let annualFee = 0.0095;
    let startWith = this.state.initialCapital;
    let firstYear = 0;
    let lastYear = 0;
    let filteredStockData = stocksData;
    if (!keepUiState){
      stocksData.forEach(row => {
        this.countTradingDaysPerYear(moment(row["date"]));
        if (firstYear === 0 || firstYear > moment(row["date"]).year()) {
          firstYear = moment(row["date"]).year();
        }
        if (lastYear === 0 || lastYear < moment(row["date"]).year()) {
          lastYear = moment(row["date"]).year();
        }
      });
      this.setYearsRange(firstYear, lastYear, firstYear, lastYear);
    }
    else{
      filteredStockData = this.filterRelevenatDataForSelectedDates(stocksData)
    }
   
    filteredStockData.forEach(row => {
      let investPerMonth = 0;
      let dailyFee = this.dailyFee(annualFee, row["date"]);

      if (prevRow != null) {
        if (this.isNewMonth(row["date"], prevRow["date"])){
          investPerMonth = parseInt(this.state.investPerMonth);
        }
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
          row[symbol + "_value"] = lev1 * prevRow[symbol + "_value"] + investPerMonth;
          row[symbol + "_valueLev2"] = (lev2 - dailyFee) * prevRow[symbol + "_valueLev2"] + investPerMonth;
          row[symbol + "_valueLev3"] = (lev3 - dailyFee) * prevRow[symbol + "_valueLev3"] + investPerMonth;
          row[symbol + "_valueLev4"] = (lev4 - dailyFee) * prevRow[symbol + "_valueLev4"] + investPerMonth;
          row[symbol + "_valueLev3Real"] = realLevPrecentage * prevRow[symbol + "_valueLev3Real"] + investPerMonth;
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

    //this.setState({ data: data });
    console.log("firstYear" + this.state.firstYear);
    return data;
  }

  componentDidMount() {
    this.getStocksData();
  }

  updateDates = (year, type) => {
    //let year = e.target.value;
    if (type === "start") {
      this.setState({ firstYear: year, selectedFirstYear: year});
    }
    if (type === "end") {
      this.setState({ lastYear: year, selectedLastYear: year });
    }
    setTimeout(() => {
      /*
      let newStartLimit = moment(this.state.firstYear + "-01-01");
      let newEndLimit = moment((this.state.lastYear + 1) + "-01-01");
      let cloneData = structuredClone(this.state.allYearsChartData);
      let newChartData = [];
      cloneData.forEach(row => {
        let curDate = moment(row["date"]);
        if (curDate >= newStartLimit && curDate <= newEndLimit) {
          newChartData.push(row);
        }
      })
      this.normalizeAndCalculateReturns(newChartData);
      */
     this.recalculate()
    }, 30);
  }

  setRange = (year, type) => {
    if (type === "first") {
      this.setState({ selectedStartDate: year });
      this.setYearsRange(this.state.firstYear, this.state.lastYear, year, this.state.selectedEndDate);
    }
    else {
      this.setState({ selectedEndDate: year });
      this.setYearsRange(this.state.firstYear, this.state.lastYear, this.state.selectedStartDate, year);
    }
  }

  findBestInRow = (row, type) => {
    let indexSymbol = this.state.selectedIndexSymbol;
    let best = row[indexSymbol + "_value" + type];
    let bestName = indexSymbol + "_value";
    if (row[indexSymbol + "_valueLev2" + type] > best) {
      best = row[indexSymbol + "_valueLev2" + type];
      bestName = indexSymbol + "_valueLev2";
    }
    if (row[indexSymbol + "_valueLev3" + type] > best) {
      best = row[indexSymbol + "_valueLev3" + type];
      bestName = indexSymbol + "_valueLev3";
    }
    if (row[indexSymbol + "_valueLev4" + type] > best) {
      bestName = indexSymbol + "_valueLev4";
    }
    return bestName + type;
  }

  render() {
    return (
      <div>
      <div className="App">
        <header>Daily Leveraged ETF Simulation</header>
        <div className="needs-recalculation-container">
            <div className="props-options">
              <div className="props-options-text">Initial Capital </div> 
              <div className="props-options-text"><input value={this.state.initialCapital} onChange={e => this.setInitialCapital(e.target.value)}/></div> 
            </div>
            <div className="props-options">
              <div className="props-options-text">Invest/Month</div> 
              <div className="props-options-text"><input value={this.state.investPerMonth} onChange={e => this.setInvestPerMonth(e.target.value)}/></div> 
            </div>
            <div className="re-calculate-btn" onClick={e => this.recalculate()}>Recalculate</div>
          </div>
        <div className="props-container">
          <div className="choose-index-symbol">
            {this.state.indexSymbols.map((indexSymbol => {
              return <div className={"index-symbol-option" + (indexSymbol === this.state.selectedIndexSymbol ? " selectedSymbol" : "")}
                onClick={() => this.setSelectedIndex(indexSymbol)}
                key={"index-option-" + indexSymbol}>{this.state.symbolsText[indexSymbol]}</div>
            }))
            }
          </div>
          <div className="props-separetor"></div>
          {this.state.tradingDaysPerYear.size > 0 ?
              <div className="years-picker-container">
                <YearPicker
                  range={[...this.state.tradingDaysPerYear.keys()]}
                  selected={this.state.selectedFirstYear}
                  type="start"
                  update={this.updateDates}
                  setOpenDatePicker={this.setOpenDatePicker}
                  openDatePicker={this.state.openDatePicker} />
                <div className="date-picker-text"><img src="https://www.itayg.com/leverage/calendar-icon.png" alt="calendar icon" /></div> 
                <YearPicker
                  range={[...this.state.tradingDaysPerYear.keys()]}
                  selected={this.state.selectedLastYear}
                  type="end"
                  update={this.updateDates}
                  setOpenDatePicker={this.setOpenDatePicker}
                  openDatePicker={this.state.openDatePicker} />
              </div>
              : null}
        </div>
        {this.state.dataLoaded ?
        <div className="calculated-data-container">
          <div className="chart-container">
            <div className="indices-chart-container">
                <ResponsiveContainer width="100%" height={600}>
                  <AreaChart data={this.state.chartData} margin={{ top: 10, right: 0, left: 0, bottom: 10 }}>
                    <defs>
                      <linearGradient id="colorBaseIndex" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0083C4" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="#0083C4" stopOpacity={0.5} />
                      </linearGradient>
                      <linearGradient id="colorX3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00C492" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="#00C492" stopOpacity={0.5} />
                      </linearGradient>
                      <linearGradient id="colorX2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#53B683" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="#80B499" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorX4" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d9c771" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="#d9c771" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorTQQQ" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#cf36cf" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="#cf36cf" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" />
                    <YAxis domain={[-100]}/>
                    <Tooltip background={{color: '#000'}}/>
                    <Legend verticalAlign="top" height={10} />
                    <Area type="monotone" name={this.state.selectedIndexSymbol} dataKey={this.state.selectedIndexSymbol} stroke="#0083C4" fillOpacity={0.3} fill={"url(#colorBaseIndex)"} />
                    <Area type="monotone" name={"Simulated " + this.state.selectedIndexSymbol + " x2"} dataKey={this.state.selectedIndexSymbol + "X2"} stroke="#80B499" fillOpacity={0.3} fill={"url(#colorX2)"} />
                    <Area type="monotone" name={"Simulated " + this.state.selectedIndexSymbol + " x3"} dataKey={this.state.selectedIndexSymbol + "X3"} stroke="#00C492" fillOpacity={0.3} fill={"url(#colorX3)"} />
                    <Area type="monotone" name={"Simulated " + this.state.selectedIndexSymbol + " x4"} dataKey={this.state.selectedIndexSymbol + "X4"} stroke="#d9c771" fillOpacity={0.3} fill={"url(#colorX4)"} />
                    {this.state.selectedIndexSymbol === "NDX" && this.state.firstYear >= 2012 ?
                        <Area type="monotone" name={"TQQQ"} dataKey={"TQQQ"} stroke="#cf36cf" fillOpacity={0.3} fill={"url(#colorTQQQ)"} />
                    : null}
                  </AreaChart>
                </ResponsiveContainer>
            </div>
          </div>
          <div className="stats-container">
            <div className="stats-titles-container">
              <div className="stats-title">{this.state.symbolsText[this.state.selectedIndexSymbol]} Returns Data {this.state.firstYear}-{this.state.lastYear}</div>
              <div className="stats-grand-titles">
                <div className="stats-grand-title-1">{this.state.symbolsText[this.state.selectedIndexSymbol]} Returns</div>
                <div className="stats-separator"></div>
                <div className="stats-grand-title-2">{this.state.symbolsText[this.state.selectedIndexSymbol]} x2 Simulated Returns</div>
                <div className="stats-separator"></div>
                <div className="stats-grand-title-3">{this.state.symbolsText[this.state.selectedIndexSymbol]} x3 Simulated Returns</div>
                <div className="stats-separator"></div>
                <div className="stats-grand-title-4">{this.state.symbolsText[this.state.selectedIndexSymbol]} x4 Simulated Returns</div>
              </div>
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
            {this.state.statsToPresent.map((stat, key) => {
              let bestAvg = this.findBestInRow(stat, "Avg");
              let bestMin = this.findBestInRow(stat, "Min");
              let bestMax = this.findBestInRow(stat, "Max");

              return <div className="stats-row" key={"year-range-" + key}>
                <div className="stats-year">{key}</div>
                <div className="stats-separator"></div>
                <div className={"stats-avg" + (bestAvg === this.state.selectedIndexSymbol + "_valueAvg" ? " best" : "")}>{this.round(stat[this.state.selectedIndexSymbol + "_valueAvg"], 2)}%</div>
                <div className={"stats-min" + (bestMin === this.state.selectedIndexSymbol + "_valueMin" ? " best" : "")}>{this.round(stat[this.state.selectedIndexSymbol + "_valueMin"], 2)}%</div>
                <div className={"stats-max" + (bestMax === this.state.selectedIndexSymbol + "_valueMax" ? " best" : "")}>{this.round(stat[this.state.selectedIndexSymbol + "_valueMax"], 2)}%</div>
                <div className="stats-separator"></div>
                <div className={"stats-avg" + (bestAvg === this.state.selectedIndexSymbol + "_valueLev2Avg" ? " best" : "")}>{this.round(stat[this.state.selectedIndexSymbol + "_valueLev2Avg"], 2)}%</div>
                <div className={"stats-min" + (bestMin === this.state.selectedIndexSymbol + "_valueLev2Min" ? " best" : "")}>{this.round(stat[this.state.selectedIndexSymbol + "_valueLev2Min"], 2)}%</div>
                <div className={"stats-max" + (bestMax === this.state.selectedIndexSymbol + "_valueLev2Max" ? " best" : "")}>{this.round(stat[this.state.selectedIndexSymbol + "_valueLev2Max"], 2)}%</div>
                <div className="stats-separator"></div>
                <div className={"stats-avg" + (bestAvg === this.state.selectedIndexSymbol + "_valueLev3Avg" ? " best" : "")}>{this.round(stat[this.state.selectedIndexSymbol + "_valueLev3Avg"], 2)}%</div>
                <div className={"stats-min" + (bestMin === this.state.selectedIndexSymbol + "_valueLev3Min" ? " best" : "")}>{this.round(stat[this.state.selectedIndexSymbol + "_valueLev3Min"], 2)}%</div>
                <div className={"stats-max" + (bestMax === this.state.selectedIndexSymbol + "_valueLev3Max" ? " best" : "")}>{this.round(stat[this.state.selectedIndexSymbol + "_valueLev3Max"], 2)}%</div>
                <div className="stats-separator"></div>
                <div className={"stats-avg" + (bestAvg === this.state.selectedIndexSymbol + "_valueLev4Avg" ? " best" : "")}>{this.round(stat[this.state.selectedIndexSymbol + "_valueLev4Avg"], 2)}%</div>
                <div className={"stats-min" + (bestMin === this.state.selectedIndexSymbol + "_valueLev4Min" ? " best" : "")}>{this.round(stat[this.state.selectedIndexSymbol + "_valueLev4Min"], 2)}%</div>
                <div className={"stats-max" + (bestMax === this.state.selectedIndexSymbol + "_valueLev4Max" ? " best" : "")}>{this.round(stat[this.state.selectedIndexSymbol + "_valueLev4Max"], 2)}%</div>
              </div>
            })}
          </div>
        </div>
        : <div className="indices-chart-loading-container">
                  <LoadingAnimation insideComponent={false} />
                </div>}
        </div>
      </div>
    );
  }

}

export default App;