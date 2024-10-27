document.getElementById('back-button').addEventListener('click', function() {
    window.location.href = 'parking.html';
});

document.getElementById('forward-button').addEventListener('click', function() {
    const highestPercentageItem = getHighestPercentageItem();
    if (highestPercentageItem) {
        localStorage.setItem('highestPercentageItem', JSON.stringify(highestPercentageItem));
        window.location.href = 'master.html';
    } else {
        alert('No data available to determine the highest percentage item.');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const csvData = localStorage.getItem('csvData');
    if (csvData) {
        displayFilteredData(csvData);
    }
});

function displayFilteredData(csv) {
    const mainTableLayers = [
        "Residential", "Mercantile_wholesale", "Mercantile_retail", "Business",
        "Institutional", "Storage", "Assembly", "Hazardous", "Industrial", "Educational"
    ];

    const rows = csv.split('\n');
    const mainTableBody = document.getElementById('filtered-table').getElementsByTagName('tbody')[0];
    const parsedData = parseCSVToArray(csv);
    const seenMainTable = new Set();

    let totalFloorArea = 0;
    let totalDeductedArea = 0;
    let totalNetArea = 0;

    const mainTableData = [];

    rows.forEach((row, index) => {
        const cells = row.split(',');

        if (index !== 0 && row.trim() !== '') {
            const layer = cells[3];
            const key = cells[3]; // Unique key for Layer
            const rowData = {
                column4: cells[3],
                totalFloorArea: parseFloat(calculateTotalFloorArea(cells, parsedData)),
                deductedArea: parseFloat(calculateDeductedArea(cells, parsedData)),
                netArea: parseFloat(calculateNetArea(
                    calculateTotalFloorArea(cells, parsedData),
                    calculateDeductedArea(cells, parsedData)
                ))
            };

            if (mainTableLayers.includes(layer)) {
                if (!seenMainTable.has(key)) {
                    seenMainTable.add(key);
                    mainTableData.push(rowData);
                    
                    totalFloorArea += rowData.totalFloorArea;
                    totalDeductedArea += rowData.deductedArea;
                    totalNetArea += rowData.netArea;
                }
            }
        }
    });

    // Populate main table
    mainTableData.forEach(data => {
        const percentage = (data.netArea / totalNetArea * 100).toFixed(2) + '%';
        const newRow = mainTableBody.insertRow();
        newRow.insertCell().textContent = data.column4;
        newRow.insertCell().textContent = formatNumber(data.totalFloorArea);
        newRow.insertCell().textContent = formatNumber(data.deductedArea);
        newRow.insertCell().textContent = formatNumber(data.netArea);
        newRow.insertCell().textContent = percentage;
    });

    // Update the total row
    document.getElementById('total-floor-area').textContent = formatNumber(totalFloorArea);
    document.getElementById('total-deducted-area').textContent = formatNumber(totalDeductedArea);
    document.getElementById('total-net-area').textContent = formatNumber(totalNetArea);
    document.getElementById('total-percentage').textContent = '100%';

    // Store data for highest percentage calculation
    localStorage.setItem('mainTableData', JSON.stringify(mainTableData));
}

function parseCSVToArray(csv) {
    const rows = csv.split('\n');
    const data = [];
    rows.forEach((row, index) => {
        if (index !== 0 && row.trim() !== '') {
            const cells = row.split(',');
            data.push({
                column1: cells[0], // 1st column (0-indexed)--Count
                column2: cells[1], // 2nd column (0-indexed)--Name
                column3: cells[2], // 3rd column (0-indexed)--Color
                column4: cells[3], // 4th column (0-indexed)--Layer
                column5: cells[4], // 5th column (0-indexed)--Length
                column6: cells[5], // 6th column (0-indexed)--Linetype
                column7: cells[6], // 7th column (0-indexed)--Lineweight
                column8: parseFloat(cells[7]) || 0, // 8th column (0-indexed)--Area
                column9: cells[8], // 9th column (0-indexed)--Closed
            });
        }
    });
    return data;
}

function calculateTotalFloorArea(filteredRow, mainTableData) {
    const column4Value = filteredRow[3]; // Filtered table 4th column value
    let sum = 0;

    mainTableData.forEach(data => {
        if (data.column4 === column4Value && data.column6 === "ByLayer") {
            sum += data.column8;
        }
    });

    return sum.toFixed(3);
}

function calculateDeductedArea(filteredRow, mainTableData) {
    const column4Value = filteredRow[3]; // Filtered table 4th column (Layer) value
    let sum = 0;

    mainTableData.forEach(data => {
        if (data.column4 === column4Value && data.column6 === "DASHED") {
            sum += data.column8;
        }
    });

    return sum.toFixed(3);
}

function calculateNetArea(totalFloorArea, deductedArea) {
    return (parseFloat(totalFloorArea) - parseFloat(deductedArea)).toFixed(3);
}

function formatNumber(value) {
    const number = parseFloat(value);
    return isNaN(number) ? '0.000' : number.toFixed(3);
}

function getHighestPercentageItem() {
    const mainTableData = JSON.parse(localStorage.getItem('mainTableData'));
    if (!mainTableData || mainTableData.length === 0) return null;

    let highestPercentageItem = null;
    let highestPercentage = -1;
    const totalNetArea = mainTableData.reduce((sum, data) => sum + data.netArea, 0);

    mainTableData.forEach(data => {
        const percentage = (data.netArea / totalNetArea * 100).toFixed(2);
        if (parseFloat(percentage) > highestPercentage) {
            highestPercentage = parseFloat(percentage);
            highestPercentageItem = {
                layer: data.column4,
                percentage: percentage
            };
        }
    });

    return highestPercentageItem;
}