import fs from 'fs/promises';
import mammoth from 'mammoth';

class ResumeProcessor {
  /**
   * Extract text from PDF, DOC, or DOCX file
   */
  static async extractTextFromFile(filePath, fileType) {
    try {
      const buffer = await fs.readFile(filePath);
      
      if (fileType === 'pdf') {
        // For PDF, just return empty string - file is stored but not parsed
        console.log('PDF file stored without text extraction');
        return '';
      } else if (fileType === 'doc' || fileType === 'docx') {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      console.error('Error extracting text:', error);
      // Return empty string instead of throwing error
      return '';
    }
  }

  /**
   * Parse resume data from extracted text
   */
  static parseResumeData(text) {
    if (!text || text.trim().length === 0) {
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

    const parsedData = {
      name: this.extractName(text),
      email: this.extractEmail(text),
      phone: this.extractPhone(text),
      skills: this.extractSkills(text),
      experience: this.extractExperience(text),
      education: this.extractEducation(text),
      summary: this.extractSummary(text)
    };

    return parsedData;
  }

  /**
   * Extract name (first line typically contains name)
   */
  static extractName(text) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length < 50 && !firstLine.includes('@') && !/\d{3,}/.test(firstLine)) {
        return firstLine;
      }
    }
    return '';
  }

  /**
   * Extract email address
   */
  static extractEmail(text) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailRegex);
    return emails && emails.length > 0 ? emails[0] : '';
  }

  /**
   * Extract phone number
   */
  static extractPhone(text) {
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = text.match(phoneRegex);
    return phones && phones.length > 0 ? phones[0] : '';
  }

  /**
   * Extract skills (look for keywords like "Skills", "Technical Skills", etc.)
   */
  static extractSkills(text) {
    const skillsSection = /(?:skills|technical skills|technologies|expertise)[\s:]*([^\n]+(?:\n(?!\n)[^\n]+)*)/i;
    const match = text.match(skillsSection);
    
    if (match && match[1]) {
      const skillsText = match[1];
      const skills = skillsText
        .split(/[,;\n|]/)
        .map(skill => skill.trim())
        .filter(skill => skill.length > 1 && skill.length < 50);
      return [...new Set(skills)].slice(0, 20);
    }
    
    return [];
  }

  /**
   * Extract work experience
   */
  static extractExperience(text) {
    const experienceSection = /(?:experience|work experience|employment|work history)[\s:]*([^\n]+(?:\n(?!\n)[^\n]+)*)/i;
    const match = text.match(experienceSection);
    
    if (match && match[1]) {
      return match[1].substring(0, 500);
    }
    
    return '';
  }

  /**
   * Extract education
   */
  static extractEducation(text) {
    const educationSection = /(?:education|academic|qualification)[\s:]*([^\n]+(?:\n(?!\n)[^\n]+)*)/i;
    const match = text.match(educationSection);
    
    if (match && match[1]) {
      return match[1].substring(0, 500);
    }
    
    return '';
  }

  /**
   * Extract summary/objective
   */
  static extractSummary(text) {
    const summarySection = /(?:summary|objective|profile|about)[\s:]*([^\n]+(?:\n(?!\n)[^\n]+)*)/i;
    const match = text.match(summarySection);
    
    if (match && match[1]) {
      return match[1].substring(0, 300);
    }
    
    return text.substring(0, 200);
  }
}

export default ResumeProcessor;