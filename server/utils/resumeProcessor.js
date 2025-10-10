import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';

class ResumeProcessor {
  static async extractTextFromFile(filePath, fileType) {
    try {
      // Check if file exists
      await fs.access(filePath);
      
      switch (fileType.toLowerCase()) {
        case 'pdf':
          return await this.extractFromPDF(filePath);
        case 'docx':
          return await this.extractFromDOCX(filePath);
        case 'doc':
          // For .doc files, you might need additional libraries like 'antiword'
          console.warn('DOC file processing not implemented yet');
          return "DOC file processing not implemented yet";
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      console.error('Text extraction error:', error.message);
      if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }
      return '';
    }
  }

  static async extractFromPDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      
      if (dataBuffer.length === 0) {
        throw new Error('PDF file is empty');
      }
      
      const data = await pdfParse(dataBuffer);
      
      if (!data.text || data.text.trim().length === 0) {
        console.warn('No text content found in PDF');
        return '';
      }
      
      return data.text;
    } catch (error) {
      console.error('PDF extraction error:', error.message);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  static async extractFromDOCX(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      
      if (!result.value || result.value.trim().length === 0) {
        console.warn('No text content found in DOCX');
        return '';
      }
      
      if (result.messages && result.messages.length > 0) {
        console.log('DOCX processing messages:', result.messages);
      }
      
      return result.value;
    } catch (error) {
      console.error('DOCX extraction error:', error.message);
      throw new Error(`Failed to extract text from DOCX: ${error.message}`);
    }
  }

  static parseResumeData(text) {
    if (!text || typeof text !== 'string') {
      console.warn('Invalid text provided for parsing');
      return this.getEmptyResumeData();
    }

    const parsedData = this.getEmptyResumeData();

    try {
      // Extract email with improved regex
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      const emailMatches = text.match(emailRegex);
      if (emailMatches && emailMatches.length > 0) {
        parsedData.email = emailMatches[0];
      }

      // Extract phone with improved regex for various formats
      const phoneRegex = /(?:\+?1[-.\s]?)?(?:\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})|(?:\+?[1-9]\d{1,14})/g;
      const phoneMatches = text.match(phoneRegex);
      if (phoneMatches && phoneMatches.length > 0) {
        // Filter out numbers that are too long/short to be phone numbers
        const validPhone = phoneMatches.find(phone => {
          const digits = phone.replace(/\D/g, '');
          return digits.length >= 10 && digits.length <= 15;
        });
        if (validPhone) {
          parsedData.phone = validPhone;
        }
      }

      // Enhanced skills extraction
      const skillKeywords = [
        'javascript', 'typescript', 'python', 'java', 'c#', 'php', 'ruby', 'go',
        'react', 'angular', 'vue.js', 'node.js', 'express', 'django', 'flask',
        'html', 'css', 'sass', 'less', 'bootstrap', 'tailwind',
        'sql', 'mongodb', 'mysql', 'postgresql', 'redis', 'elasticsearch',
        'docker', 'kubernetes', 'jenkins', 'terraform',
        'aws', 'azure', 'gcp', 'heroku', 'vercel',
        'git', 'github', 'gitlab', 'bitbucket',
        'agile', 'scrum', 'kanban', 'jira', 'confluence',
        'machine learning', 'ai', 'data science', 'pandas', 'numpy',
        'rest api', 'graphql', 'microservices', 'devops'
      ];
      
      const foundSkills = skillKeywords.filter(skill => 
        text.toLowerCase().includes(skill.toLowerCase())
      );
      parsedData.skills = [...new Set(foundSkills)];

      // Extract name (improved heuristic)
      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      if (lines.length > 0) {
        for (let i = 0; i < Math.min(3, lines.length); i++) {
          const line = lines[i];
          // Check if line looks like a name (not too long, not an email, not all caps)
          if (line.length < 50 && 
              !line.includes('@') && 
              !line.includes('http') &&
              line !== line.toUpperCase() &&
              /^[a-zA-Z\s.'-]+$/.test(line)) {
            parsedData.name = line;
            break;
          }
        }
      }

      // Extract basic sections
      parsedData.summary = this.extractSection(text, ['summary', 'objective', 'profile']);
      parsedData.experience = this.extractSection(text, ['experience', 'employment', 'work history']);
      parsedData.education = this.extractSection(text, ['education', 'academic', 'qualification']);

    } catch (error) {
      console.error('Resume parsing error:', error.message);
    }

    return parsedData;
  }

  static getEmptyResumeData() {
    return {
      name: '',
      email: '',
      phone: '',
      skills: [],
      experience: '',
      education: '',
      summary: ''
    };
  }

  static extractSection(text, keywords) {
    try {
      const lines = text.split('\n');
      let sectionStart = -1;
      
      // Find section start
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase().trim();
        if (keywords.some(keyword => line.includes(keyword.toLowerCase()))) {
          sectionStart = i;
          break;
        }
      }
      
      if (sectionStart === -1) return '';
      
      // Extract section content (next few lines or until next section)
      const sectionLines = [];
      for (let i = sectionStart + 1; i < Math.min(sectionStart + 10, lines.length); i++) {
        const line = lines[i].trim();
        if (line.length === 0) continue;
        
        // Stop if we hit what looks like another section header
        if (line.length < 20 && line.toUpperCase() === line) {
          break;
        }
        
        sectionLines.push(line);
      }
      
      return sectionLines.join(' ').substring(0, 500); // Limit length
    } catch (error) {
      console.error('Section extraction error:', error.message);
      return '';
    }
  }

  // Utility method to validate file type
  static getSupportedFileTypes() {
    return ['pdf', 'docx'];
  }

  static isFileTypeSupported(fileType) {
    return this.getSupportedFileTypes().includes(fileType.toLowerCase());
  }
}

export default ResumeProcessor;