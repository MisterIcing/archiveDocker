import { Typography, IconButton, Paper } from "@mui/material";
import styles from '../global.module.css';
import { useState, useEffect } from "react";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import {io} from 'socket.io-client';

const socket = io(`http://${window.location.hostname}:5000`, {transports: ['websocket', 'polling'], reconnectionAttempts: 3, timeout: 5000});

function TaskOutput(task) {
    const [drop, setDrop] = useState(false);
    const [status, setStatus] = useState(task.task.status);
    const [taskId, setTask] = useState(task.task.id);

    const handleUpdate = (data) => {
      if (data.taskId === taskId) {
        setStatus(data.status);
      }
    }

    useEffect(() => {
      socket.on(`tUpdate`, handleUpdate)
    
      return () => {
        socket.off(`tUpdate`, handleUpdate);
      };

    }, [taskId])

    return (
        <Paper key={`${taskId}_outer`} style={{width: '99%', display: 'flex', padding: '1%', border: '1px solid black'}}
          className={
            status === 'FINISHED' ? styles.gStatDone 
            : status === 'STARTED' ? styles.gStatRun 
            : status === 'FAILED' ? styles.gStatErr
            : status === 'REVOKED' ? styles.gStatErr
            : status === 'IDLE' ? styles.gStatIdle
            : styles.globalsecback
          }
        >
            <div key={`${taskId}_inner`} style={{width: '100%', alignContent: 'center'}}>
                <div key={taskId} style={{display: 'grid',  gridTemplateColumns: '1fr 1fr'}}>
                    <Typography className={styles.globaltext} style={{whiteSpace: 'pre-line', gridRow: '1', gridColumn: '1'}} key={`${taskId}_0`}><b>ID:</b> {taskId}</Typography>
                    <Typography className={styles.globaltext} style={{whiteSpace: 'pre-line', gridRow: '2', gridColumn: '1'}} key={`${taskId}_1`}><b>URL:</b> {task.task.url}</Typography>
                    <Typography className={styles.globaltext} style={{whiteSpace: 'pre-line', gridRow: '2', gridColumn: '3'}} key={`${taskId}_2`}><b>Glob:</b> {task.task.glob}</Typography>
                    <Typography className={styles.globaltext} style={{whiteSpace: 'pre-line', gridRow: '1', gridColumn: '3'}} key={`${taskId}_3`}><b>Status:</b> {status}</Typography>
                </div>
                {drop ? 
                    <div key={`${taskId}_sub_0`} style={{paddingLeft: '1%'}}>
                        <Typography className={styles.globaltext} style={{whiteSpace: 'pre-line'}} key={`${taskId}_sub_data`}>{task.task.res}</Typography>
                    </div>
                    : <div key={`${taskId}_sub_1`}></div>
                }
            </div>
            <IconButton key={`${taskId}_button`} onClick={() => setDrop(!drop)}>
                {drop ? 
                    <ExpandLessIcon key={`${taskId}_icon_0`} />
                    :
                    <ExpandMoreIcon key={`${taskId}_icon_1`} />
                }
            </IconButton>
        </Paper>
    )
}

export default TaskOutput;