import fs from 'fs/promises';
import csv from 'csv-parser';
import { createReadStream } from 'fs';
import xlsx from 'xlsx';

class CSVProcessor {
  /**
   * Process CSV file and extract data
   */
  static async processCSVFile(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      let headers = [];
      let rowCount = 0;

      createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headerList) => {
          headers = headerList.map(h => h.trim());
        })
        .on('data', (data) => {
          rowCount++;
          // Clean up data keys (trim whitespace)
          const cleanedData = {};
          for (const [key, value] of Object.entries(data)) {
            cleanedData[key.trim()] = typeof value === 'string' ? value.trim() : value;
          }
          results.push(cleanedData);
        })
        .on('end', () => {
          resolve({
            headers,
            data: results,
            totalRows: rowCount
          });
        })
        .on('error', (error) => {
          reject(new Error(`Failed to process CSV: ${error.message}`));
        });
    });
  }

  /**
   * Process Excel file (.xlsx or .xls)
   */
  static async processExcelFile(filePath) {
    try {
      // Read the Excel file
      const workbook = xlsx.readFile(filePath);
      
      // Get the first sheet name
      const sheetName = workbook.SheetNames[0];
      
      if (!sheetName) {
        throw new Error('Excel file contains no sheets');
      }
      
      // Get the worksheet
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with header row
      const jsonData = xlsx.utils.sheet_to_json(worksheet, {
        defval: null, // Use null for empty cells
        raw: false // Format values as strings
      });
      
      // Extract headers
      const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
      
      // Clean and trim headers
      const cleanHeaders = headers.map(h => h.trim());
      
      // Clean data - trim string values
      const cleanData = jsonData.map(row => {
        const cleanRow = {};
        for (const key of Object.keys(row)) {
          const cleanKey = key.trim();
          const value = row[key];
          cleanRow[cleanKey] = typeof value === 'string' ? value.trim() : value;
        }
        return cleanRow;
      });
      
      return {
        headers: cleanHeaders,
        data: cleanData,
        totalRows: cleanData.length,
        metadata: {
          sheetName: sheetName,
          totalSheets: workbook.SheetNames.length,
          allSheetNames: workbook.SheetNames
        }
      };
    } catch (error) {
      throw new Error(`Failed to process Excel file: ${error.message}`);
    }
  }

  /**
   * Process all sheets in an Excel file
   */
  static async processAllExcelSheets(filePath) {
    try {
      const workbook = xlsx.readFile(filePath);
      const allSheets = [];

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet, {
          defval: null,
          raw: false
        });

        const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
        const cleanHeaders = headers.map(h => h.trim());

        const cleanData = jsonData.map(row => {
          const cleanRow = {};
          for (const key of Object.keys(row)) {
            const cleanKey = key.trim();
            const value = row[key];
            cleanRow[cleanKey] = typeof value === 'string' ? value.trim() : value;
          }
          return cleanRow;
        });

        allSheets.push({
          sheetName,
          headers: cleanHeaders,
          data: cleanData,
          totalRows: cleanData.length
        });
      }

      return {
        sheets: allSheets,
        totalSheets: workbook.SheetNames.length
      };
    } catch (error) {
      throw new Error(`Failed to process Excel sheets: ${error.message}`);
    }
  }

  /**
   * Validate CSV/Excel data
   */
  static validateCSVData(csvData) {
    const errors = [];

    // Check if CSV has data
    if (!csvData.data || csvData.data.length === 0) {
      errors.push('File is empty or contains no valid data');
    }

    // Check if CSV has headers
    if (!csvData.headers || csvData.headers.length === 0) {
      errors.push('File has no headers');
    }

    // Check for duplicate headers
    const headerSet = new Set(csvData.headers);
    if (headerSet.size !== csvData.headers.length) {
      errors.push('File contains duplicate headers');
    }

    // Check for empty headers
    const emptyHeaders = csvData.headers.filter(h => !h || h.trim() === '');
    if (emptyHeaders.length > 0) {
      errors.push('File contains empty column headers');
    }

    // Check row count limit
    if (csvData.totalRows > 50000) {
      errors.push('File exceeds maximum row limit of 50,000');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get CSV/Excel statistics
   */
  static getCSVStatistics(csvData) {
    const stats = {
      totalRows: csvData.totalRows,
      totalColumns: csvData.headers.length,
      headers: csvData.headers,
      emptyRows: 0,
      columnStats: {}
    };

    // Initialize column stats
    csvData.headers.forEach(header => {
      stats.columnStats[header] = {
        emptyCount: 0,
        uniqueValues: new Set()
      };
    });

    // Analyze data
    csvData.data.forEach(row => {
      let isEmptyRow = true;
      
      csvData.headers.forEach(header => {
        const value = row[header];
        
        if (value !== null && value !== undefined && value !== '') {
          isEmptyRow = false;
          stats.columnStats[header].uniqueValues.add(value);
        } else {
          stats.columnStats[header].emptyCount++;
        }
      });

      if (isEmptyRow) {
        stats.emptyRows++;
      }
    });

    // Convert Sets to counts
    csvData.headers.forEach(header => {
      stats.columnStats[header].uniqueCount = stats.columnStats[header].uniqueValues.size;
      delete stats.columnStats[header].uniqueValues;
    });

    return stats;
  }

  /**
   * Transform CSV/Excel data based on mapping
   */
  static transformCSVData(csvData, mapping) {
    const transformedData = csvData.data.map(row => {
      const transformed = {};
      
      for (const [targetKey, sourceKey] of Object.entries(mapping)) {
        transformed[targetKey] = row[sourceKey] || '';
      }
      
      return transformed;
    });

    return {
      headers: Object.keys(mapping),
      data: transformedData,
      totalRows: transformedData.length
    };
  }

  /**
   * Filter CSV/Excel data based on conditions
   */
  static filterCSVData(csvData, filterFunction) {
    const filteredData = csvData.data.filter(filterFunction);

    return {
      headers: csvData.headers,
      data: filteredData,
      totalRows: filteredData.length
    };
  }

  /**
   * Export data back to CSV file
   */
  static async exportToCSV(csvData, outputPath) {
    try {
      // Create CSV content
      let csvContent = csvData.headers.join(',') + '\n';
      
      csvData.data.forEach(row => {
        const values = csvData.headers.map(header => {
          const value = row[header] || '';
          // Escape commas and quotes
          const escaped = String(value).replace(/"/g, '""');
          return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')
            ? `"${escaped}"`
            : escaped;
        });
        csvContent += values.join(',') + '\n';
      });

      // Write to file
      await fs.writeFile(outputPath, csvContent, 'utf8');
      return true;
    } catch (error) {
      throw new Error(`Failed to export CSV: ${error.message}`);
    }
  }

  /**
   * Export data to Excel file
   */
  static async exportToExcel(csvData, outputPath, sheetName = 'Sheet1') {
    try {
      // Create a new workbook
      const workbook = xlsx.utils.book_new();
      
      // Convert data to worksheet
      const worksheet = xlsx.utils.json_to_sheet(csvData.data, {
        header: csvData.headers
      });
      
      // Add worksheet to workbook
      xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Write to file
      xlsx.writeFile(workbook, outputPath);
      
      return true;
    } catch (error) {
      throw new Error(`Failed to export Excel: ${error.message}`);
    }
  }

  /**
   * Get file info without processing full data
   */
  static async getFileInfo(filePath, fileType) {
    try {
      if (fileType === 'csv') {
        // For CSV, read first few lines
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim());
        const firstLine = lines[0] || '';
        const headers = firstLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        
        return {
          headers,
          estimatedRows: lines.length - 1,
          fileType: 'csv'
        };
      } else if (fileType === 'xlsx' || fileType === 'xls') {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const range = xlsx.utils.decode_range(worksheet['!ref'] || 'A1');
        
        // Get headers from first row
        const headers = [];
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = xlsx.utils.encode_cell({ r: range.s.r, c: col });
          const cell = worksheet[cellAddress];
          headers.push(cell ? String(cell.v).trim() : `Column${col + 1}`);
        }
        
        return {
          headers,
          estimatedRows: range.e.r - range.s.r,
          fileType: fileType,
          sheetName: sheetName,
          totalSheets: workbook.SheetNames.length,
          allSheetNames: workbook.SheetNames
        };
      }
    } catch (error) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  /**
   * Sanitize data for database storage
   */
  static sanitizeData(data, maxRows = 10000) {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    // Limit rows
    const limitedData = data.slice(0, maxRows);

    // Sanitize each row
    return limitedData.map(row => {
      const sanitizedRow = {};
      for (const [key, value] of Object.entries(row)) {
        // Truncate long strings
        if (typeof value === 'string' && value.length > 1000) {
          sanitizedRow[key] = value.substring(0, 1000) + '...';
        } else {
          sanitizedRow[key] = value;
        }
      }
      return sanitizedRow;
    });
  }

  /**
   * Detect column data types
   */
  static detectColumnTypes(data, headers) {
    const types = {};
    
    for (const header of headers) {
      const values = data.slice(0, 100).map(row => row[header]).filter(v => v != null && v !== '');
      
      if (values.length === 0) {
        types[header] = 'unknown';
        continue;
      }

      // Check if all values are numbers
      const allNumbers = values.every(v => !isNaN(parseFloat(v)) && isFinite(v));
      if (allNumbers) {
        types[header] = 'number';
        continue;
      }

      // Check if values look like dates
      const datePattern = /^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}$/;
      const allDates = values.every(v => datePattern.test(String(v)));
      if (allDates) {
        types[header] = 'date';
        continue;
      }

      // Check if values are boolean-like
      const boolValues = ['true', 'false', 'yes', 'no', '1', '0'];
      const allBooleans = values.every(v => boolValues.includes(String(v).toLowerCase()));
      if (allBooleans) {
        types[header] = 'boolean';
        continue;
      }

      types[header] = 'string';
    }

    return types;
  }

  /**
   * Convert Excel date serial to JavaScript Date
   */
  static excelDateToJSDate(serial) {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info;
  }
}

export default CSVProcessor;