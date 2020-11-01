import express, {Express, Request, RequestHandler, Response} from 'express';
import {config} from './config';
import {oldSubmitSponsorTimes} from './routes/oldSubmitSponsorTimes';
import {oldGetVideoSponsorTimes} from './routes/oldGetVideoSponsorTimes';
import {postSegmentShift} from './routes/postSegmentShift';
import {postWarning} from './routes/postWarning';
import {getIsUserVIP} from './routes/getIsUserVIP';
import {deleteNoSegments} from './routes/deleteNoSegments';
import {postNoSegments} from './routes/postNoSegments';
import {getUserInfo} from './routes/getUserInfo';
import {getDaysSavedFormatted} from './routes/getDaysSavedFormatted';
import {getTotalStats} from './routes/getTotalStats';
import {getTopUsers} from './routes/getTopUsers';
import {getViewsForUser} from './routes/getViewsForUser';
import {getSavedTimeForUser} from './routes/getSavedTimeForUser';
import {addUserAsVIP} from './routes/addUserAsVIP';
import {shadowBanUser} from './routes/shadowBanUser';
import {getUsername} from './routes/getUsername';
import {setUsername} from './routes/setUsername';
import {viewedVideoSponsorTime} from './routes/viewedVideoSponsorTime';
import {voteOnSponsorTime} from './routes/voteOnSponsorTime';
import {getSkipSegmentsByHash} from './routes/getSkipSegmentsByHash';
import {postSkipSegments} from './routes/postSkipSegments';
import {endpoint as getSkipSegments} from './routes/getSkipSegments';
import {userCounter} from './middleware/userCounter';
import {loggerMiddleware} from './middleware/logger';
import {corsMiddleware} from './middleware/cors';
import {rateLimitMiddleware} from './middleware/requestRateLimit';
import {getCategoryStats} from './routes/getCategoryStats';


export function createServer(callback: () => void) {
    // Create a service (the app object is just a callback).
    const app = express();

    //setup CORS correctly
    app.use(corsMiddleware);
    app.use(loggerMiddleware);
    app.use(express.json());

    if (config.userCounterURL) app.use(userCounter);

    // Setup pretty JSON
    if (config.mode === "development") app.set('json spaces', 2);

    // Set production mode
    app.set('env', config.mode || 'production');

    setupRoutes(app);

    return app.listen(config.port, callback);
}

function setupRoutes(app: Express) {
    // Rate limit endpoint lists
    const voteEndpoints: RequestHandler[] = [voteOnSponsorTime];
    const viewEndpoints: RequestHandler[] = [viewedVideoSponsorTime];
    if (config.rateLimit) {
        if (config.rateLimit.vote) voteEndpoints.unshift(rateLimitMiddleware(config.rateLimit.vote));
        if (config.rateLimit.view) viewEndpoints.unshift(rateLimitMiddleware(config.rateLimit.view));
    }

    //add the get function
    app.get('/api/getVideoSponsorTimes', oldGetVideoSponsorTimes);

    //add the oldpost function
    app.get('/api/postVideoSponsorTimes', oldSubmitSponsorTimes);
    app.post('/api/postVideoSponsorTimes', oldSubmitSponsorTimes);

    //add the skip segments functions
    app.get('/api/skipSegments', getSkipSegments);
    app.post('/api/skipSegments', postSkipSegments);

    // add the privacy protecting skip segments functions
    app.get('/api/skipSegments/:prefix', getSkipSegmentsByHash);

    //voting endpoint
    app.get('/api/voteOnSponsorTime', ...voteEndpoints);
    app.post('/api/voteOnSponsorTime', ...voteEndpoints);

    //Endpoint when a submission is skipped
    app.get('/api/viewedVideoSponsorTime', ...viewEndpoints);
    app.post('/api/viewedVideoSponsorTime', ...viewEndpoints);

    //To set your username for the stats view
    app.post('/api/setUsername', setUsername);

    //get what username this user has
    app.get('/api/getUsername', getUsername);

    //Endpoint used to hide a certain user's data
    app.post('/api/shadowBanUser', shadowBanUser);

    //Endpoint used to make a user a VIP user with special privileges
    app.post('/api/addUserAsVIP', addUserAsVIP);

    //Gets all the views added up for one userID
    //Useful to see how much one user has contributed
    app.get('/api/getViewsForUser', getViewsForUser);

    //Gets all the saved time added up (views * sponsor length) for one userID
    //Useful to see how much one user has contributed
    //In minutes
    app.get('/api/getSavedTimeForUser', getSavedTimeForUser);

    app.get('/api/getTopUsers', getTopUsers);

    //send out totals
    //send the total submissions, total views and total minutes saved
    app.get('/api/getTotalStats', getTotalStats);

    app.get('/api/getUserInfo', getUserInfo);

    app.get('/api/getCategoryStats', getCategoryStats);

    //send out a formatted time saved total
    app.get('/api/getDaysSavedFormatted', getDaysSavedFormatted);

    //submit video containing no segments
    app.post('/api/noSegments', postNoSegments);

    app.delete('/api/noSegments', deleteNoSegments);

    //get if user is a vip
    app.get('/api/isUserVIP', getIsUserVIP);

    //sent user a warning
    app.post('/api/warnUser', postWarning);

    //get if user is a vip
    app.post('/api/segmentShift', postSegmentShift);

    app.get('/database.db', function (req: Request, res: Response) {
        res.sendFile("./databases/sponsorTimes.db", {root: "./"});
    });
}
