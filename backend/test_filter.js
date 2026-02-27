const cricketApiService = require('./src/services/cricketApiService');

const mockMatches = [
    {
        id: "mock-1",
        name: "India vs Australia T20",
        matchType: "t20",
        teams: ["India", "Australia"],
        matchStarted: true,
        matchEnded: false
    },
    {
        id: "mock-2",
        name: "Thailand vs Japan T20",
        matchType: "t20",
        teams: ["Thailand", "Japan"],
        matchStarted: true,
        matchEnded: false
    }
];

console.log("Testing Major Event Filter...");
mockMatches.forEach(m => {
    const isMajor = cricketApiService.isMajorEvent(m);
    console.log(`${m.name} | Major: ${isMajor}`);
});
