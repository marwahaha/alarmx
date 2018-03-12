var CronJob = require('cron').CronJob;
const express = require('express');
const app = express();

var allJobs = [];

// Define API

// Private
var startJob = (job) => job.start();
var stopJob = (job) => job.stop();
var getCronFromJob = (job) => job.cronTime.source;
var getJobInfo = (job, id) => ({message: job.message, cron: getCronFromJob(job), id: id, running: job.running});
var getIndexFromId = (id) => Number.parseInt(id, 10) - 1;
var getJobById = (id) => allJobs[getIndexFromId(id)];

function createJob(cron, message, id) {
  var job = new CronJob(cron, () => console.log(message + " (job #" + id + ")"), null, true, 'America/Los_Angeles');
  job.message = message; 
  // TODO should job save its ID (and use a global counter) or should I stick with array position in allJobs?
  return job;
}

// Public
function addJob(cron, message) {
  var id = allJobs.length + 1;
  allJobs.push(createJob(cron, message, id));
  return id;
}

function startJobById(id) {
  var job = getJobById(id);
  if (!job) {
    return "Could not find job #" + id;
  }
  startJob(job);
  return "Started job #" + id;
}

function stopJobById(id) {
  var job = getJobById(id);
  if (!job) {
    return "Could not find job #" + id;
  }
  stopJob(job);
  return "Stopped job #" + id;
}

function stopAllJobs() {
  for (job of allJobs) {
    stopJob(job);
  }
  return "Stopped all jobs";
}

function getInfoById(id) {
  var job = getJobById(id);
  if (!job) {
    return "Could not find job #" + id;
  }
  return getJobInfo(job, id);
}

function getAllJobInfo() {
  var allInfo = [];
  for (var i = 0; i < allJobs.length; i++) {
    allInfo.push(getJobInfo(allJobs[i], i+1));
  }
  return allInfo;
}

// TODO do I want to enable updates?
function updateJobCron(id, cron) {
  var job = getJobById(id);
  stopJob(job);
  if (!job) {
    return "Could not find job #" + id;
  }
  allJobs[getIndexFromId(id)] = createJob(cron, job.message, id);
  return "Updated job #" + id;
}

function updateJobMessage(id, message) {
  var job = getJobById(id);
  stopJob(job);
  if (!job) {
    return "Could not find job #" + id;
  }
  allJobs[getIndexFromId(id)] = createJob(getCronFromJob(job), message, id);
  return "Updated job #" + id;
}

// Wire API
// TODO add authentication
app.get('/job/', (req, res) => res.send('Hello World!'));
app.get('/job/add/:cron/:message', (req, res) => res.send("Added job #" + addJob(req.params.cron, req.params.message))); // TODO make post?
app.get('/job/stop/all', (req, res) => res.send(stopAllJobs())); // TODO make post?
app.get('/job/stop/:id', (req, res) => res.send(stopJobById(req.params.id))); // TODO make post?
app.get('/job/start/:id', (req, res) => res.send(startJobById(req.params.id))); // TODO make post?
app.get('/job/info/all', (req, res) => res.send(getAllJobInfo()));
app.get('/job/info/:id', (req, res) => res.send(getInfoById(req.params.id)));
app.get('/job/update/:id/cron/:cron', (req, res) => res.send(updateJobCron(req.params.id, req.params.cron))); // TODO make post?
app.get('/job/update/:id/message/:message', (req, res) => res.send(updateJobMessage(req.params.id, req.params.message))); // TODO make post?


// TODO split into multiple files

// People API
people = {} // [name]: [notes: ,freq: ,id: ,events:{[when]: {id:, what:, reminderIds: [], verified: }] history: [(list of events)]

function addPerson(name, notes, freq) {
  // TODO error handling on name already taken
  var id = addJob(freq, "Recurrence - " + name);
  people[name] = {notes: notes, freq: freq, id: id, events: [], history: []};
  return "Added person: " + name;
}

function acceptRecurrence(id) {
  stopJobById(id);
  startJobById(id);
  // TODO be smarter; if there's an event before next recurrence then add x days after recurrence
}

function snoozeRecurrence(id, cron) {
  // TODO should reschedule cron for new time
}

function scheduleEvent(who, when, what) {
  // TODO error handling on people[who] 
  // TODO create reminders (to confirm with person) (1mo, 1wk, 1d) - this opens a whole can of worms if the event reschedules
  // TODO create job for event (replace id: 0)
  people[who].events[when] = {what: what, verified: false, id: 0, reminderIds: []};
}

function verifyEvent(who, when) {
  // TODO error handling
  var person = people[who];
  var event = person.events[when];
  event.verified = true;
  person.history.push(event);
  person.events[when] = undefined;

  // TODO make sure event recurrence is at right time
}


function updatePersonName(who, name) {
  // TODO think this through - it may have implications with recurrence messages, other API calls, events
}

function updatePersonNotes(who, notes) {
  // TODO error handling
  people[who].notes = notes;
}

function updatePersonFreq(who, freq) {
  // TODO error handling
  people[who].freq = freq;
  // TODO update the recurrence frequency
}

app.get('/person/add/:name/:notes/:freq', (req, res) => res.send(addPerson(req.params.name, req.params.notes, req.params.freq))); // TODO make post?

// TODO make into parameters
app.get('/person/update/:who/name/:name', (req, res) => res.send(updatePersonName(req.params.who, req.params.name))); // TODO make post?
app.get('/person/update/:who/notes/:notes', (req, res) => res.send(updatePersonNotes(req.params.who, req.params.notes))); // TODO make post?
app.get('/person/update/:who/freq/:freq', (req, res) => res.send(updatePersonFreq(req.params.who, req.params.freq))); // TODO make post?



// Start app
app.listen(3000, () => console.log("starting...."));

