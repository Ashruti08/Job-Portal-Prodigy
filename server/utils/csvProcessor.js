import csvParser from 'csv-parser';
import fs from 'fs';

class CSVProcessor {
  static async processCSVFile(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      let headers = [];
      let rowCount = 0;

      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('headers', (headerList) => {
          headers = headerList.map(header => header.trim());
        })
        .on('data', (data) => {
          // Clean and process each row
          const cleanedData = {};
          for (const key in data) {
            const cleanKey = key.trim();
            cleanedData[cleanKey] = data[key] ? data[key].toString().trim() : '';
          }
          results.push(cleanedData);
          rowCount++;
        })
        .on('end', () => {
          resolve({
            headers,
            data: results,
            totalRows: rowCount
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  static validateCSVData(data, expectedHeaders = []) {
    const errors = [];
    
    if (!data.headers || data.headers.length === 0) {
      errors.push('CSV file must have headers');
    }

    if (expectedHeaders.length > 0) {
      const missingHeaders = expectedHeaders.filter(header => 
        !data.headers.includes(header)
      );
      if (missingHeaders.length > 0) {
        errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
      }
    }

    if (!data.data || data.data.length === 0) {
      errors.push('CSV file must contain data rows');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default CSVProcessor;