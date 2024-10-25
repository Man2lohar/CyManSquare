// Function to display data in the table
function displayData(csv) {
    const rows = csv.split('\n');
    const tableHeader = document.getElementById('table-header');
    const tableBody = document.getElementById('data-table').getElementsByTagName('tbody')[0];

    // Clear existing table content
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';

    // Track seen rows for duplication check
    const seenRows = new Set();
    const duplicateRows = new Set();

    // Define a set of valid layer names
    const validLayerNames = new Set([
        "Plot", "Road", "Splay", "Strip", "Ground Coverage", "Tree Cover", "Open Space",
        "Open Space_Ext_1", "Residential", "Mercantile_wholesale", "Mercantile_retail", "Business", "Institutional", "Storage",
        "Assembly", "Hazardous", "Industrial", "Educational", "Internal Road", "Alignment", "Stair",
        "Lift", "Lift_Ext_1", "Loft", "Cupboard", "Tenement", "Tenement_Ext_1",
        "Tenement_Single", "Tenement_Single_Ext_1", "Height", "Floor Height",
        "Roof_Structure", "Terrace", "Parking", "Parking_Area", "Waterbody", "Heritage",
        "Existing", "Service_floor", "Common Area", "Column", "Wall", "Text", "Dimension",
        "Section", "Print", "Mis1", "Block_Text", "Fire Refuge", "Triple_Balcony", "Goomty",
        "Court Yard", "Shaft", "Corridor", "STP", "RWH", "Pavement", "EVCP", "Solar",
        "Baby Care Room"
    ]);

    // Define accepted layers as an array
    const acceptedLayers = ['Residential', 'Mercantile_wholesale', 'Mercantile_retail', 'Business',
        'Institutional', 'Storage', 'Assembly', 'Hazardous', 'Industrial', 'Educational'];

    // Lineweight always ByLayer
    const ByLayers = ['Common Area', 'Cupboard', 'Ground Coverage', 'Open Space', 'Roof_Structure', 'Terrace', 'Internal Road', 'Loft'];

    // Lineweight never ByLayer
    const NeverByLayers = ['Existing', 'Floor Height', 'Height', 'Parking', 'Parking_Area', 'Stair', 'Tenement', 'Tenement_Single',
        'Tenement_Ext_1', 'Tenement_Single_Ext_1', 'Tree Cover', 'Shaft', 'Court Yard', 'Heritage', 'Waterbody', 'Splay', 'Strip', 'Corridor', 'Lift'
    ];

    // Define condition styles with flexible conditions
const conditions = [
    { check: (cells, indices) => !validLayerNames.has(cells[indices.layer]), errorMessage: "Invalid Layer Name" },
    { check: (cells, indices) => cells[indices.count] !== '1', errorMessage: "Count must be 1" },
    { check: (cells, indices) => !['ByLayer', 'DASHED', 'PHANTOM2'].includes(cells[indices.linetype]), errorMessage: "Invalid Linetype" },
    { check: (cells, indices) => cells[indices.name] === 'Polyline' && cells[indices.closed] == 0, errorMessage: "Polyline must be closed" },
    { check: (cells, indices) => !['Polyline', 'Line', 'Point'].includes(cells[indices.name]), errorMessage: "Invalid Object Name" },
    { check: (cells, indices) => cells[indices.name] === 'Polyline' && cells[indices.area].trim() === '', errorMessage: "Polyline area is missing" },
    { check: (cells, indices) => acceptedLayers.includes(cells[indices.layer]) && !['ByLayer', 'DASHED'].includes(cells[indices.linetype]), errorMessage: "Linetype should be ByLayer or DASHED" },
    { check: (cells, indices) => ByLayers.includes(cells[indices.layer]) && cells[indices.lineweight] !== 'ByLayer', errorMessage: "Lineweight must be ByLayer" },
    { check: (cells, indices) => NeverByLayers.includes(cells[indices.layer]) && cells[indices.name] === 'Polyline' && cells[indices.lineweight] === 'ByLayer', errorMessage: "Lineweight must not be ByLayer" },
    { 
        check: (cells, indices) => {
            const colorValue = parseInt(cells[indices.color], 10);
            return (cells[indices.name] === 'Polyline' && cells[indices.layer] === 'Plot' && (colorValue !== 240 || cells[indices.lineweight] !== '0.50 mm')) ||
                   (cells[indices.layer] === 'Ground Coverage' && (colorValue < 53 || colorValue > 152) && cells[indices.name] === 'Polyline');
        }, 
        errorMessage: "Invalid color for Plot or Ground Coverage" 
    }
];

// Function to apply styles based on conditions
function applyStyles(cells, indices) {
    for (const { check, errorMessage } of conditions) {
        if (check(cells, indices)) {
            return 'text-red'; // Apply the error style
        }
    }
    return ''; // No error
}

    // First pass: Detect duplicates
    rows.forEach((row, index) => {
        const cells = row.split(',');

        if (index > 0 && row.trim() !== '') { // Skip header row
            const rowStr = cells.join(',');
            if (seenRows.has(rowStr)) {
                duplicateRows.add(rowStr);
            }
            seenRows.add(rowStr);
        }
    });

    // Track invalid layers
    const invalidLayers = new Set();

    // Track layers present in the data
    const foundLayers = new Set();

    let allErrorMessages = []; // Array to collect all error messages

    // Create a tracker for lineweights based on name
    const lineweightTracker = {
        'Strip': new Set(),
        'Splay': new Set(),
        'Plot': new Set(),
        'Tree Cover': new Set()
    };

    // Second pass: Create table and apply styles
    let columnIndices = {};

    // Ensure rows is defined and populated
    if (!rows || !Array.isArray(rows)) {
        console.error("Rows is undefined or not an array.");
        return;  // Exit early if rows is not valid
    }

    // Define the lineweights to check
    const expectedLineweights = ['0.15 mm', '0.20 mm', '0.25 mm', '0.30 mm']; // Add other lineweights as needed

    // Create a set to track reported errors
    const reportedErrors = new Set();

    rows.forEach((row, index) => {
        const cells = row.split(',');

        if (index === 0) {
            // Create table headers and determine column indices
            cells.forEach((cell, cellIndex) => {
                const th = document.createElement('th');
                th.textContent = cell;
                th.setAttribute('name', `header-${cellIndex}`);
                th.setAttribute('id', `header-${cellIndex}`);
                tableHeader.appendChild(th);

                // Store column indices
                if (cell.trim() === 'Count') columnIndices.count = cellIndex;
                if (cell.trim() === 'Name') columnIndices.name = cellIndex;
                if (cell.trim() === 'Color') columnIndices.color = cellIndex;
                if (cell.trim() === 'Layer') columnIndices.layer = cellIndex;
                if (cell.trim() === 'Length') columnIndices.length = cellIndex;
                if (cell.trim() === 'Linetype') columnIndices.linetype = cellIndex;
                if (cell.trim() === 'Lineweight') columnIndices.lineweight = cellIndex;
                if (cell.trim() === 'Area') columnIndices.area = cellIndex;
                if (cell.trim() === 'Closed') columnIndices.closed = cellIndex;
            });

        } else if (row.trim() !== '') {
            const newRow = tableBody.insertRow();
            const rowStr = cells.join(',');
            let errorMessages = [];

            // Ensure cells and columns are properly indexed
            const layer = cells[columnIndices.layer]?.trim();
            const name = cells[columnIndices.name]?.trim();
            const lineweight = cells[columnIndices.lineweight]?.trim();

            // Track the layers present in the data
            if (layer) {
                foundLayers.add(layer);
            }

            // Check for invalid layers
            if (layer && !validLayerNames.has(layer)) {
                invalidLayers.add(layer); // Add invalid layer to the set
            }

            // Check for duplicate lineweights for "Strip" and "Splay"
            if (['Strip', 'Splay', 'Plot', 'Tree Cover'].includes(layer)) {
                if (lineweightTracker[layer].has(lineweight)) {
                    // If lineweight already exists for the same name, mark it as duplicate
                    newRow.classList.add('text-red'); // Apply red text style
                    errorMessages.push(`Duplicate lineweight found for ${layer}: ${lineweight}`);
                } else {
                    // If not, add it to the tracker
                    lineweightTracker[layer].add(lineweight);
                }
            }

            // Check for missing lines for each expected lineweight in the Stair layer
            if (layer === 'Stair' && name === 'Polyline') {
                expectedLineweights.forEach(expectedWeight => {
                    if (lineweight === expectedWeight) {
                        // Check if a corresponding line exists
                        const matchingLineExists = rows.some((r) => {
                            const lineCells = r.split(',');
                            const lineLayer = lineCells[columnIndices.layer]?.trim();
                            const lineName = lineCells[columnIndices.name]?.trim();
                            const lineLineweight = lineCells[columnIndices.lineweight]?.trim();
                            return lineLayer === 'Stair' && lineName === 'Line' && lineLineweight === expectedWeight;
                        });

                        if (!matchingLineExists) {
                            const errorMessage = `Line is missing for the Stair with lineweight ${expectedWeight}`;
                            if (!reportedErrors.has(errorMessage)) {
                                reportedErrors.add(errorMessage); // Track reported error
                                newRow.classList.add('error'); // Style the row with error
                                errorMessages.push(errorMessage);
                            }
                        }
                    }
                });
            }

            // Check for missing Line for Lift layer
            if (layer === 'Lift' && name === 'Polyline') {
                const matchingLiftLineExists = rows.some((r) => {
                    const lineCells = r.split(',');
                    const lineLayer = lineCells[columnIndices.layer]?.trim();
                    const lineName = lineCells[columnIndices.name]?.trim();
                    return lineLayer === 'Lift' && lineName === 'Line';
                });

                if (!matchingLiftLineExists) {
                    const errorMessage = `Line is missing for the Lift layer`;
                    if (!reportedErrors.has(errorMessage)) {
                        reportedErrors.add(errorMessage); // Track reported error
                        newRow.classList.add('error'); // Style the row with error
                        errorMessages.push(errorMessage);
                    }
                }
            }

            // Add duplicate style if necessary
            if (duplicateRows.has(rowStr)) {
                newRow.classList.add('duplicate');
            }

            // Apply other conditions and styles
            conditions.forEach(condition => {
                if (condition.check(cells, columnIndices)) {
                    newRow.classList.add(condition.style);
                    const conditionErrorMessage = `In ${layer} Layer: ${condition.errorMessage}`;
                    if (!reportedErrors.has(conditionErrorMessage)) {
                        reportedErrors.add(conditionErrorMessage);
                        errorMessages.push(conditionErrorMessage);
                    }
                }
            });

            // Add error messages to allErrorMessages array
            if (errorMessages.length > 0) {
                allErrorMessages.push(`Row ${index + 1}: ${errorMessages.join(', ')}`); // Track which row has the error
            }

            // Create table cells
            cells.forEach((cell, cellIndex) => {
                const newCell = newRow.insertCell();
                newCell.textContent = cell;
                newCell.setAttribute('name', `row${index}-cell${cellIndex}`);
                newCell.setAttribute('id', `row${index}-cell${cellIndex}`);
            });
        }
    });

    // Find missing layers by comparing validLayerNames with foundLayers
    const missingLayers = Array.from(validLayerNames).filter(layer => !foundLayers.has(layer));

    // After processing all rows, show the modal if there are any error messages or invalid layers
    if (allErrorMessages.length > 0 || invalidLayers.size > 0 || missingLayers.length > 0) {
        // Show error messages if any
        let errorMessageContent = allErrorMessages.length > 0 ? allErrorMessages.join('<br>') : '';

        // Add invalid layers to the message
        if (invalidLayers.size > 0) {
            const invalidLayersList = Array.from(invalidLayers).join(' , ');
            errorMessageContent += `<br><br><strong>Invalid Layers or Misspelled:</strong> ${invalidLayersList}`;
        }

        // Add missing layers to the message with alternate colors
        if (missingLayers.length > 0) {
            let missingLayersContent = '<br><br><strong>Below Layers Are Not In This Drawing:</strong><br>' + missingLayers.map((layer, index) => {
                const style = index % 2 === 0 ? 'color: blue;' : 'color: green;';
                return `<span style="${style}">${layer}</span>`;
            }).join(' , ');
            errorMessageContent += missingLayersContent;
        }
        // Display the error modal
        showModal(errorMessageContent);
    }
}

// Function to show the modal with error messages
function showModal(errorMessages) {
    const modal = document.getElementById('errorModal');
    const modalBody = document.getElementById('modalBody');
    const closeModal = document.getElementsByClassName('close')[0];

    // Insert the error messages into the modal body
    modalBody.innerHTML = errorMessages;

    // Display the modal
    modal.style.display = 'block';

    // Close the modal when the user clicks on <span> (x)
    closeModal.onclick = function() {
        modal.style.display = 'none';
    }

    // Close the modal when the user clicks outside the modal content
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
}


// Check for existing data in localStorage when the page loads
window.onload = function() {
    const storedCsvData = localStorage.getItem('csvData');
    if (storedCsvData) {
        displayData(storedCsvData);
    }
};

document.getElementById('file-input').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const csv = XLSX.utils.sheet_to_csv(worksheet);
            localStorage.setItem('csvData', csv); // Save data to localStorage
            displayData(csv);
        };
        reader.readAsArrayBuffer(file);
    }
});

document.getElementById('generate-tables').addEventListener('click', function() {
    window.location.href = 'tables.html';
});

document.getElementById('calculate').addEventListener('click', function() {
    window.location.href = 'filtered.html'; // Redirect to filtered.html
});

document.getElementById('instruction').addEventListener('click', function() {
    window.location.href = 'instruction.html'; // Redirect to filtered.html
});