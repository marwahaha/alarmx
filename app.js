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
  return "Added job #" + id;
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
app.get('/', (req, res) => res.send('Hello World!'));
app.get('/add/:cron/:message', (req, res) => res.send(addJob(req.params.cron, req.params.message))); // TODO make post?
app.get('/stop/all', (req, res) => res.send(stopAllJobs())); // TODO make post?
app.get('/stop/:id', (req, res) => res.send(stopJobById(req.params.id))); // TODO make post?
app.get('/start/:id', (req, res) => res.send(startJobById(req.params.id))); // TODO make post?
app.get('/info/all', (req, res) => res.send(getAllJobInfo()));
app.get('/info/:id', (req, res) => res.send(getInfoById(req.params.id)));
app.get('/update/:id/cron/:cron', (req, res) => res.send(updateJobCron(req.params.id, req.params.cron))); // TODO make post?
app.get('/update/:id/message/:message', (req, res) => res.send(updateJobMessage(req.params.id, req.params.message))); // TODO make post?

// Start app
app.listen(3000, () => console.log("starting...."));