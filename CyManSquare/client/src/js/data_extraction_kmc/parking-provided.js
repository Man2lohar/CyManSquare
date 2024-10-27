 // Function to calculate Nos. of Parking based on Color
 function calculateParkingNos(color, count) {
    const colorMapping = {
        '20': 1,
        '30': 2,
        '40': 3,
        '50': 4,
        '60': 5
    };
    return (colorMapping[color] || 0) * count;
}

// Function to calculate Parking Area based on Color and Lineweight
function calculateParkingArea(color, lineweight, count) {
    if (color === '20' && lineweight === '0.20 mm') {
        return 25 * count;
    } else if (color === '20' && lineweight === '0.25 mm') {
        return 0 * count;
    } else if (['30', '40', '50', '60'].includes(color) && lineweight === '0.20 mm') {
        return 25 * count;
    } else if (['30', '40', '50', '60'].includes(color) && lineweight === '0.25 mm') {
        return 0 * count;
    } else {
        return 40 * count;
    }
}

// Function to display only Parking Layer data with merged rows and Nos. of Parking
function displayMergedParkingData(csv) {
    const rows = csv.split('\n');
    const parkingTableHeader = document.getElementById('parking-table-header');
    const parkingTableBody = document.getElementById('parking-table').getElementsByTagName('tbody')[0];
    const parkingTableFooter = document.getElementById('parking-table-footer'); // Refers to <tr> in <tfoot>

    // Clear existing table content
    parkingTableHeader.innerHTML = '';
    parkingTableBody.innerHTML = '';
    parkingTableFooter.innerHTML = '';

    let columnIndices = {};
    const parkingDataMap = {}; // To store unique rows for merging
    let totalParkingNos = 0; // To calculate total Nos. of Parking
    let totalParkingArea = 0; // To calculate total Parking Area

    // Loop through rows to filter and merge "Parking" layer
    rows.forEach((row, index) => {
        const cells = row.split(',');

        if (index === 0) {
            // Find the indices of 'Count', 'Color', 'Lineweight', and 'Layer' columns
            cells.forEach((cell, cellIndex) => {
                if (cell.trim() === 'Count') {
                    columnIndices.count = cellIndex;
                }
                if (cell.trim() === 'Color') {
                    columnIndices.color = cellIndex;
                }
                if (cell.trim() === 'Lineweight') {
                    columnIndices.lineweight = cellIndex;
                }
                if (cell.trim() === 'Layer') {
                    columnIndices.layer = cellIndex;
                }
            });

            // Create table headers including 'Nos. of Parking' and 'Parking Area'
            ['Count', 'Color', 'Lineweight', 'Nos. of Parking', 'Parking Area'].forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                parkingTableHeader.appendChild(th);
            });
        } else if (cells[columnIndices.layer] && cells[columnIndices.layer].trim() === 'Parking') {
            // Extract the 'Count', 'Color', and 'Lineweight' values
            const countValue = parseInt(cells[columnIndices.count], 10) || 0;
            const colorValue = cells[columnIndices.color].trim();
            const lineweightValue = cells[columnIndices.lineweight].trim();

            // Create a unique key based on 'Color' and 'Lineweight'
            const key = `${colorValue}-${lineweightValue}`;

            // If the row is already in the map, update the count; otherwise, add it
            if (parkingDataMap[key]) {
                parkingDataMap[key].count += countValue;
            } else {
                parkingDataMap[key] = {
                    count: countValue,
                    color: colorValue,
                    lineweight: lineweightValue
                };
            }
        }
    });

    // Display the merged rows in the table and calculate the total "Nos. of Parking" and "Parking Area"
    Object.values(parkingDataMap).forEach(({ count, color, lineweight }) => {
        const newRow = parkingTableBody.insertRow();
        const newCellCount = newRow.insertCell();
        const newCellColor = newRow.insertCell();
        const newCellLineweight = newRow.insertCell();
        const newCellParkingNos = newRow.insertCell();
        const newCellParkingArea = newRow.insertCell();

        const parkingNos = calculateParkingNos(color, count);
        const parkingArea = calculateParkingArea(color, lineweight, count);

        // Update the row data
        newCellCount.textContent = count;
        newCellColor.textContent = color;
        newCellLineweight.textContent = lineweight;
        newCellParkingNos.textContent = parkingNos;
        newCellParkingArea.textContent = parkingArea;

        // Update the total Nos. of Parking and total Parking Area
        totalParkingNos += parkingNos;
        totalParkingArea += parkingArea;
    });

    // Create footer row to display the total Nos. of Parking and Parking Area
    const footerCellTotalText = document.createElement('td');
    footerCellTotalText.colSpan = 3; // Merge first three cells for "Total" text
    footerCellTotalText.textContent = 'Total:';
    parkingTableFooter.appendChild(footerCellTotalText);

    const footerCellTotalParkingNos = document.createElement('td');
    footerCellTotalParkingNos.textContent = totalParkingNos;
    parkingTableFooter.appendChild(footerCellTotalParkingNos);

    const footerCellTotalParkingArea = document.createElement('td');
    footerCellTotalParkingArea.textContent = totalParkingArea;
    parkingTableFooter.appendChild(footerCellTotalParkingArea);

    console.log("Footer row inserted with totals!");

    // Store the total Nos. of Parking in localStorage
    localStorage.setItem('totalParkingNos', totalParkingNos);
    localStorage.setItem('totalParkingArea', totalParkingArea);
}


// When the page loads, retrieve CSV data and display merged Parking layer rows
document.addEventListener('DOMContentLoaded', function() {
    const csvData = localStorage.getItem('csvData');
    if (csvData) {
        displayMergedParkingData(csvData); // Call function to display merged data
    } else {
        console.error('No CSV data found in localStorage');
    }
});