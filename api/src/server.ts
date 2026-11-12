import {Server} from 'http';
import app from "./app";
import config from './config';
import { AppointmentService } from './app/modules/appointment/appointment.service';

async function bootstrap(){
    AppointmentService.syncUnifiedAppointmentIds()
        .then((updated) => {
            if (updated > 0) {
                console.log(`Synchronized ${updated} appointment tracking ID(s) with appointment IDs.`);
            }
        })
        .catch((err) => {
            console.warn('Appointment ID synchronization skipped:', err?.message || err);
        });

    const server:Server = app.listen(config.port, () =>{
        console.log(`Server running on port ${config.port}`);
    });

    const exitHandler = () =>{
        if(server){
            server.close(() =>{
                console.log('Server Close')
            })
        }
    };

    const unexpectedHandler = (error: any) => {
        console.error('Unexpected Error:', error);
    };
    process.on('uncaughtException', unexpectedHandler);
    process.on('unhandledRejection', unexpectedHandler);

    process.on('SIGTERM', () =>{
        console.log('Sigterm Recieved');
        if(server){
            server.close();
        }
    })
}

bootstrap();