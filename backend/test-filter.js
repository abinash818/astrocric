const cricketApiService = require('./src/services/cricketApiService');

const testMatches = [
    { name: 'India vs England 1st Test', matchType: 'test', teams: ['India', 'England'] }, // Skip: Test
    { name: 'IPL 2024: CSK vs MI', matchType: 't20', teams: ['CSK', 'MI'] }, // Keep: IPL
    { name: 'Tamil Nadu Premier League: Dindigul vs Kovai', matchType: 't20', teams: ['Dindigul', 'Kovai'] }, // Skip: Local
    { name: 'BBL: Perth vs Sydney', matchType: 't20', teams: ['Perth', 'Sydney'] }, // Keep: BBL
    { name: 'India vs Pakistan ODI', matchType: 'odi', teams: ['India', 'Pakistan'] }, // Keep: International
    { name: 'Random Club Match', matchType: 't20', teams: ['Club A', 'Club B'] }, // Skip: Local
    { name: 'Australia vs Sri Lanka T20I', matchType: 't20i', teams: ['Australia', 'Sri Lanka'] }, // Keep: T20I
];

console.log('--- Testing isMajorEvent Filtering ---');
testMatches.forEach(m => {
    const keep = cricketApiService.isMajorEvent(m);
    console.log(`[${keep ? 'KEEP' : 'SKIP'}] ${m.name} (${m.matchType})`);
});
