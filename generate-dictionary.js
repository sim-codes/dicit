#!/usr/bin/env node

/**
 * Dictionary Data Generator
 * 
 * This script helps generate a local dictionary file from various sources.
 * You can expand the word list and fetch definitions from the online API
 * to build a comprehensive offline dictionary.
 */

const fs = require('fs');
const path = require('path');

// Common English words to include in offline dictionary
const commonWords = [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it',
  'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this',
  'but', 'his', 'by', 'from', 'they', 'she', 'or', 'an', 'will', 'my',
  'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if',
  'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like',
  'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
  'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look',
  'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two',
  'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because',
  'any', 'these', 'give', 'day', 'most', 'us', 'computer', 'internet', 'browser',
  'extension', 'dictionary', 'offline', 'connection', 'chrome', 'firefox', 'safari'
];

async function fetchDefinition(word) {
  try {
    console.log(`Fetching definition for: ${word}`);
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    
    if (!response.ok) {
      console.log(`  ❌ Not found: ${word}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`  ✅ Found: ${word}`);
    return data[0];
  } catch (error) {
    console.log(`  ❌ Error fetching ${word}:`, error.message);
    return null;
  }
}

async function generateDictionary() {
  console.log('🚀 Starting dictionary generation...');
  console.log(`📝 Processing ${commonWords.length} words`);
  
  const dictionary = {};
  let successCount = 0;
  let failureCount = 0;
  
  for (let i = 0; i < commonWords.length; i++) {
    const word = commonWords[i];
    const definition = await fetchDefinition(word);
    
    if (definition) {
      dictionary[word] = {
        phonetic: definition.phonetic || '',
        phonetics: definition.phonetics || [],
        meanings: definition.meanings || []
      };
      successCount++;
    } else {
      failureCount++;
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Progress indicator
    const progress = Math.round(((i + 1) / commonWords.length) * 100);
    process.stdout.write(`\r📊 Progress: ${progress}% (${successCount} success, ${failureCount} failed)`);
  }
  
  console.log('\n\n📁 Writing dictionary file...');
  
  const outputPath = path.join(__dirname, 'data', 'dictionary.json');
  fs.writeFileSync(outputPath, JSON.stringify(dictionary, null, 2));
  
  console.log(`✅ Dictionary generated successfully!`);
  console.log(`📊 Final stats: ${successCount} definitions, ${failureCount} failed`);
  console.log(`💾 Saved to: ${outputPath}`);
  console.log(`📏 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
}

// Check if running in Node.js environment
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  generateDictionary().catch(console.error);
}

module.exports = { generateDictionary, fetchDefinition };
