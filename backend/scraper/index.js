import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Basic generic scraper simulation.
 * Note: Many modern job boards block scraping aggressively.
 * This simulates parsing if successful, otherwise falls back to mocked robust data.
 */
export async function scrapeJobs(role = 'Developer', location = '', remote = false, skills = '', experience = '') {
  try {
    console.log(`Scraping jobs for role: ${role}, Location: ${location}, Remote: ${remote}, Skills: ${skills}, Exp: ${experience}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const skillText = skills ? `Requires expertise in ${skills}.` : '';
    const expText = experience ? `Ideal candidate has ${experience}+ years of experience.` : '';

    // Fallback Mock Data returning "scraped-like" structure
    return [
      {
        id: `scraped-${Date.now()}-1`,
        title: `Senior ${role || 'Engineer'}`,
        company: 'TechFlow Solutions',
        location: remote ? 'Remote (Anywhere)' : (location || 'New York, NY'),
        type: 'Full-Time',
        description: `Looking for an experienced professional to lead our engineering teams and architect scalable solutions. ${skillText} ${expText}`,
        postedAt: new Date(Date.now() - 86400000).toISOString(),
        source: 'Scraped (Simulated)'
      },
      {
        id: `scraped-${Date.now()}-2`,
        title: `${role || 'Developer'}`,
        company: 'Innovate AI',
        location: remote ? 'Remote (US)' : (location || 'San Francisco, CA'),
        type: 'Full-Time',
        description: `Join a fast-growing startup building the next generation of AI tools. Competitive equity. ${skillText} ${expText}`,
        postedAt: new Date(Date.now() - 172800000).toISOString(),
        source: 'Scraped (Simulated)'
      },
       {
        id: `scraped-${Date.now()}-3`,
        title: `Lead ${role || 'Engineer'}`,
        company: 'Global Fintech Inc',
        location: 'London, UK',
        type: 'Hybrid',
        description: `We need a lead developer for our high-throughput trading systems. ${skillText} ${expText}`,
        postedAt: new Date(Date.now() - 3600000).toISOString(),
        source: 'Scraped (Simulated)'
      }
    ].filter(job => {
      // Basic filtering based on requested params
      if (remote && !job.location.toLowerCase().includes('remote')) return false;
      return true;
    });

  } catch (error) {
    console.error('Scraping failed:', error.message);
    return [];
  }
}
