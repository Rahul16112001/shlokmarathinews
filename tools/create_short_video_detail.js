const fs = require('fs');
let c = fs.readFileSync('c:/Users/Yashb/Desktop/shlokmarathinews/video-detail.html', 'utf8');
c = c.replace(/<title>.*?<\/title>/, '<title>शॉर्ट व्हिडिओ | श्लोक मराठी न्यूज</title>');
c = c.replace(/data-page="category"/, 'data-page="short-video-detail"');
fs.writeFileSync('c:/Users/Yashb/Desktop/shlokmarathinews/short-video-detail.html', c);
