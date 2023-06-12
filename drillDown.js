import { LightningElement } from 'lwc';
import getQuarterwisedata from '@salesforce/apex/DashBoardApexClass.getQuarterwisedata';
import getMonthwisedata from '@salesforce/apex/DashBoardApexClass.getMonthwisedata';
import chartjs from '@salesforce/resourceUrl/ChartJs';
import { loadScript} from 'lightning/platformResourceLoader';
export default class DrillDown extends LightningElement {
    chart;
    salesDataResults;
    monthData;
    quartersChartData;
    isBackButton = false;
    graphType = 'bar';
    get options() {
        return [
            { label: 'Bar Graph', value: 'bar' },
            { label: 'Line Graph', value: 'line' },
            { label: 'pie Graph', value: 'pie' },
        ];
    }
    handleChange(event) {
        this.graphType = event.detail.value;
        this.chart.config.type = this.graphType;
        this.chart.update();
    }
    async connectedCallback() {
        this.isBackButton = false;
        await getQuarterwisedata().then(result => {
            this.salesDataResults = result;
            this.updateChart(this.salesDataResults);
        })
    }
    async renderedCallback() {
        Promise.all([
            await loadScript(this, chartjs),
        ])
            .then(() => {
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error loading Chart',
                        message: error.message,
                        variant: 'error',
                    })
                );
            });
    }
    updateChart(quaterData) {
        const canvas = this.template.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        try {
            this.chart = new window.Chart(ctx, {
                type: 'bar',
                data: {},
                options: {

                    resposive: true,
                    legend: {
                        position: 'right',
                    },
                    scales: {
                        xAxes: [{

                            scaleLabel: {
                                display: true,
                                labelString: 'Quater/Month wise products Sold'
                            },
                            stacked: true,

                        }],
                        yAxes: [{
                            scaleLabel: {
                                display: true,
                                labelString: 'Product Sold Price'
                            },
                            stacked: true,
                        }]
                    },
                }
            });
        } 
        catch (error) {
        }
        const quartersCategories = [...new Set(quaterData.map(item => item.ProductCat__c))];
        const quarters = [...new Set(quaterData.map(item => item.Quarter__c))].sort();
        const quartersDatasets = quartersCategories.map(categery => {
            return {
                label: categery,
                data: quarters.map(q => {
                    const record = quaterData.find(item => item.ProductCat__c === categery && item.Quarter__c === q);
                    return record ? record.PriceOfTheProducet : 0;
                }),
                backgroundColor: categery == "Clothing" ? "blue" : categery == "Electronics" ? "red" : "Yellow",
            };
        });

        this.quartersChartData = {
            labels: quarters.map((quarter) => `Q${quarter}`),
            datasets: quartersDatasets
        };

        this.chart.data = this.quartersChartData;
        this.chart.update();
    }
    updateMonthChart(monthData) {
        this.chart.data = {};
        const monthCategories = [...new Set(monthData.map(item => item.ProductCat__c))];
        const months = [...new Set(monthData.map(item => item.month))].sort();
        const monthDatasets = monthCategories.map(categery => {
            return {
                label: categery,
                data: months.map(q => {
                    const record = monthData.find(item => item.ProductCat__c === categery && item.month === q);
                    return record ? record.PriceOfTheProducet : 0;
                }),
                backgroundColor: categery == "Clothing" ? "green" : categery == "pink" ? "rgba(0,14,209,0.8)" : "brown",
            };
        });
        const monthChartData = {
            labels: months.map((mon) => {
                return mon == '1' ? 'JAN' : mon == '2' ? 'FEB' : mon == '3' ? 'MAR' : mon == '4' ? 'APR'
                    : mon == '5' ? 'MAY' : mon == '6' ? 'JUN' : mon == '7' ? 'JUL' : mon == '8' ? 'AUG'
                        : mon == '9' ? 'SEP' : mon == '10' ? 'OCT' : mon == '11' ? 'NOV' : 'DEC'
            }),
            datasets: monthDatasets
        };

        this.chart.data = { ...monthChartData };
        this.chart.update();
        this.isBackButton = true;
    }
    drilldownHandller(evt) {
        var activePoints = this.chart.getElementsAtEvent(evt);
        for (let i = 0; i < activePoints.length; i++) {
            if (activePoints[i]) {
                var chartData = activePoints[i]['_chart'].config.data;
                var idx = activePoints[i]['_index'];
                var label = chartData.labels[idx].slice(1);
                var value = chartData.datasets[i].data[idx];
                if (label != null && value != null & chartData.labels[idx].includes('Q')) {
                    this.salesByMonthHandller(label)
                }
            }
        }
    }

    salesByMonthHandller(quarter) {
        getMonthwisedata({ quarter: quarter })
            .then((results) => {
                if (results.length) {
                    this.updateMonthChart(results)
                }
            })
            .catch(error => {
                console.log(error);
            })
    }

    handleClickBack() {
        this.chart.data = {};
        this.connectedCallback();
        this.graphType = 'bar';
    }
}