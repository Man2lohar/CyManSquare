document.getElementById('back-button').addEventListener('click', function() {
    window.location.href = 'sanction.html';
});

document.getElementById('check-button').addEventListener('click', function() {
    window.location.href = 'check.html';
});

document.addEventListener('DOMContentLoaded', function() {
    const csvData = localStorage.getItem('csvData');
    if (csvData) {
        displayFilteredData(csvData);
    }
});

function displayFilteredData(csv) {
    const validLayers = [
        "Residential", "Mercantile_wholesale", "Mercantile_retail", "Business",
        "Institutional", "Storage", "Assembly", "Hazardous", "Industrial", "Educational"
    ];

    const rows = csv.split('\n');
    const tableBody = document.getElementById('filtered-table').getElementsByTagName('tbody')[0];
    const totalFloorAreaCell = document.getElementById('total-floor-area');
    const totalStairWellCell = document.getElementById('total-stair-well');
    const totalLiftWellCell = document.getElementById('total-lift-well');
    const totalDuctCutoutCell = document.getElementById('total-duct-cutout');
    const totalEffectiveFloorAreaCell = document.getElementById('total-effective-floor-area');
    const totalStairwayCell = document.getElementById('total-stairway');
    const totalLiftLobbyCell = document.getElementById('total-lift-lobby');
    const totalNetFloorAreaCell = document.getElementById('total-net-floor-area');
    
    const mainTableData = parseCSVToArray(csv);

    const uniqueColors = new Set();
    const totalAreas = {};
    const stairWellAreas = {};
    const liftWellAreas = {};
    const ductCutoutAreas = {};
    const stairwayAreas = {};
    const liftLobbyAreas = {};
    
    const stairMinColorByLineweight = {};
    const liftMinColorByLineweight = {};

    rows.forEach((row, index) => {
        const cells = row.split(',');

        if (index !== 0 && row.trim() !== '') {
            const color = cells[2];
            const layer = cells[3];

            if (validLayers.includes(layer)) {
                uniqueColors.add(color);

                if (!totalAreas[color]) {
                    totalAreas[color] = 0;
                }
                if (cells[5] === "ByLayer" && cells[6] === "ByLayer" && cells[1] === "Polyline" && cells[8] === "-1") {
                    totalAreas[color] += parseFloat(cells[7] || 0);
                }
            }
        }
    });

    mainTableData.forEach(row => {
        const name = row.column2;
        const color = row.column3;
        const layer = row.column4;
        const linetype = row.column6;
        const lineweight = row.column7;
        const area = row.column8;
        const closed = row.column9;

        if (layer === "Stair" && name === "Polyline" && closed === "-1") {
            if (!stairMinColorByLineweight[lineweight]) {
                stairMinColorByLineweight[lineweight] = color;
            } else {
                stairMinColorByLineweight[lineweight] = Math.min(stairMinColorByLineweight[lineweight], color);
            }
        }

        if (layer === "Lift" && name === "Polyline" && closed === "-1") {
            if (!liftMinColorByLineweight[lineweight]) {
                liftMinColorByLineweight[lineweight] = color;
            } else {
                liftMinColorByLineweight[lineweight] = Math.min(liftMinColorByLineweight[lineweight], color);
            }
        }

        if (layer === "Stair" && linetype === "DASHED" && name === "Polyline" && closed === "-1") {
            if (!stairWellAreas[color]) {
                stairWellAreas[color] = 0;
            }
            stairWellAreas[color] += area;
        }

        if (layer === "Lift" && linetype === "ByLayer" && name === "Polyline" && closed === "-1") {
            if (!liftWellAreas[color]) {
                liftWellAreas[color] = 0;
            }
            liftWellAreas[color] += area;
        }

        if (validLayers.includes(layer) && linetype === "DASHED" && name === "Polyline" && closed === "-1") {
            if (!ductCutoutAreas[color]) {
                ductCutoutAreas[color] = 0;
            }
            ductCutoutAreas[color] += area;
        }

        if (layer === "Stair" && linetype !== "DASHED" && name === "Polyline" && closed === "-1") {
            if (!stairwayAreas[color]) {
                stairwayAreas[color] = 0;
            }
            stairwayAreas[color] += area;
        }

        if (layer === "Lift" && linetype === "DASHED" && name === "Polyline" && closed === "-1") {
            if (!liftLobbyAreas[color]) {
                liftLobbyAreas[color] = 0;
            }
            liftLobbyAreas[color] += area;
        }
    });

    mainTableData.forEach(row => {
        const name = row.column2;
        const color = row.column3;
        const layer = row.column4;
        const linetype = row.column6;
        const area = row.column8;
        const closed = row.column9;

        if (layer === "Stair" && linetype === "DASHED" && name === "Polyline" && closed === "-1") {
            if (stairwayAreas[color]) {
                stairwayAreas[color] -= area;
            }
        }
    });

    uniqueColors.forEach(color => {
        const totalDuctArea = ductCutoutAreas[color] || 0;
        const stairWellArea = stairWellAreas[color] || 0;
        const liftWellArea = liftWellAreas[color] || 0;

        const calculatedDuctCutoutArea = totalDuctArea - stairWellArea - liftWellArea;

        ductCutoutAreas[color] = calculatedDuctCutoutArea;
    });

    const filteredData = filterAndFindMinColorByLineweight(mainTableData);
    const areasByCombination = calculateAreasByCombination(filteredData, mainTableData);

    Object.entries(areasByCombination.Stair).forEach(([lineweight, colorAreas]) => {
        Object.entries(colorAreas).forEach(([color, area]) => {
            if (stairWellAreas[color]) {
                stairWellAreas[color] -= area;
                ductCutoutAreas[color] += area;
            }
        });
    });

    Object.entries(areasByCombination.Lift).forEach(([lineweight, colorAreas]) => {
        Object.entries(colorAreas).forEach(([color, area]) => {
            if (liftWellAreas[color]) {
                liftWellAreas[color] -= area;
                ductCutoutAreas[color] += area;
            }
        });
    });

    const sortedData = Array.from(uniqueColors).map(color => {
        return {
            color: color,
            totalArea: totalAreas[color] || 0,
            stairWellArea: stairWellAreas[color] || 0,
            liftWellArea: liftWellAreas[color] || 0,
            ductCutoutArea: ductCutoutAreas[color] || 0,
            stairwayArea: stairwayAreas[color] || 0,
            liftLobbyArea: liftLobbyAreas[color] || 0
        };
    });

    sortedData.sort((a, b) => a.color - b.color);

    let totalSum = 0;
    let stairWellSum = 0;
    let liftWellSum = 0;
    let ductCutoutSum = 0;
    let effectiveFloorAreaSum = 0;
    let stairwaySum = 0;
    let liftLobbySum = 0;
    let netFloorAreaSum = 0;

    sortedData.forEach(data => {
        const newRow = tableBody.insertRow();
        newRow.insertCell().textContent = data.color;
        const totalArea = data.totalArea;
        newRow.insertCell().textContent = formatNumber(totalArea.toFixed(3));

        const stairWellArea = data.stairWellArea;
        newRow.insertCell().textContent = formatNumber(stairWellArea.toFixed(3));

        const liftWellArea = data.liftWellArea;
        newRow.insertCell().textContent = formatNumber(liftWellArea.toFixed(3));

        const ductCutoutArea = data.ductCutoutArea;
        newRow.insertCell().textContent = formatNumber(ductCutoutArea.toFixed(3));

        const effectiveFloorArea = totalArea - stairWellArea - liftWellArea - ductCutoutArea;
        newRow.insertCell().textContent = formatNumber(effectiveFloorArea.toFixed(3));

        const stairwayArea = data.stairwayArea;
        newRow.insertCell().textContent = formatNumber(stairwayArea.toFixed(3));

        const liftLobbyArea = data.liftLobbyArea;
        newRow.insertCell().textContent = formatNumber(liftLobbyArea.toFixed(3));

        const netFloorArea = effectiveFloorArea - stairwayArea - liftLobbyArea;
        newRow.insertCell().textContent = formatNumber(netFloorArea.toFixed(3));

        totalSum += totalArea;
        stairWellSum += stairWellArea;
        liftWellSum += liftWellArea;
        ductCutoutSum += ductCutoutArea;
        effectiveFloorAreaSum += effectiveFloorArea;
        stairwaySum += stairwayArea;
        liftLobbySum += liftLobbyArea;
        netFloorAreaSum += netFloorArea;
    });

    totalFloorAreaCell.textContent = formatNumber(totalSum.toFixed(3));
    totalStairWellCell.textContent = formatNumber(stairWellSum.toFixed(3));
    totalLiftWellCell.textContent = formatNumber(liftWellSum.toFixed(3));
    totalDuctCutoutCell.textContent = formatNumber(ductCutoutSum.toFixed(3));
    totalEffectiveFloorAreaCell.textContent = formatNumber(effectiveFloorAreaSum.toFixed(3));
    totalStairwayCell.textContent = formatNumber(stairwaySum.toFixed(3));
    totalLiftLobbyCell.textContent = formatNumber(liftLobbySum.toFixed(3));
    totalNetFloorAreaCell.textContent = formatNumber(netFloorAreaSum.toFixed(3));
}

function parseCSVToArray(csv) {
    const rows = csv.split('\n');
    return rows.map(row => {
        const columns = row.split(',');
        return {
            column1: columns[0],
            column2: columns[1],
            column3: columns[2],
            column4: columns[3],
            column5: columns[4],
            column6: columns[5],
            column7: columns[6],
            column8: parseFloat(columns[7]) || 0,
            column9: columns[8]
        };
    });
}

function filterAndFindMinColorByLineweight(data) {
    const validLayers = ["Stair", "Lift"];
    const areasByLineweight = {};

    data.forEach(row => {
        const name = row.column2;
        const color = row.column3;
        const layer = row.column4;
        const linetype = row.column6;
        const lineweight = row.column7;
        const area = row.column8;
        const closed = row.column9;

        if (validLayers.includes(layer) && linetype === "DASHED" && name === "Polyline" && closed === "-1") {
            if (!areasByLineweight[layer]) {
                areasByLineweight[layer] = {};
            }
            if (!areasByLineweight[layer][lineweight]) {
                areasByLineweight[layer][lineweight] = {};
            }

            if (!areasByLineweight[layer][lineweight][color]) {
                areasByLineweight[layer][lineweight][color] = 0;
            }
            areasByLineweight[layer][lineweight][color] += area;
        }
    });

    return areasByLineweight;
}

function calculateAreasByCombination(filteredData, mainTableData) {
    const validLayers = ["Stair", "Lift"];
    const areasByCombination = {};

    Object.entries(filteredData).forEach(([layer, data]) => {
        areasByCombination[layer] = {};
        Object.entries(data).forEach(([lineweight, colorData]) => {
            Object.entries(colorData).forEach(([color, area]) => {
                const mainTableRow = mainTableData.find(row => {
                    return (
                        row.column2 === "Polyline" &&
                        row.column3 === color &&
                        row.column4 === layer &&
                        row.column6 === "ByLayer" &&
                        row.column8 === area
                    );
                });

                if (mainTableRow) {
                    if (!areasByCombination[layer][lineweight]) {
                        areasByCombination[layer][lineweight] = {};
                    }

                    if (!areasByCombination[layer][lineweight][color]) {
                        areasByCombination[layer][lineweight][color] = 0;
                    }

                    areasByCombination[layer][lineweight][color] += area;
                }
            });
        });
    });

    return areasByCombination;
}

function formatNumber(num) {
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
