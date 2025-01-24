import './Ia.css'
import styles from '../global.module.css';
import { Button, Card, IconButton, TextField, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
// import Header from '../Components/Header';
import TabbedArea from '../Components/TabbedArea';
import { useEffect, useState } from 'react';
import axios from 'axios';
// import {io} from 'socket.io-client';

function Ia() {
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Variables
  const [inputurl, setinputurl] = useState('');           // URL/Identifier input field 
  const [url, seturl] = useState('');                     // URL/Identifier debounced
  const [inputGlob, setInputGlob] = useState("*");        // Glob pattern input field
  const [glob, setGlob] = useState ('*');                 // Glob pattern debounced

  // disabled bc download doesnt actually have an exclude
  //   having this makes it seem that it would affect the download even though it doesnt
  // const [inputExclude, setInputExclude] = useState('');   // Exclude pattern input field
  // const [exclude, setExclude] = useState('');             // Exclude pattern debounced

  const [resGlob, setResGlob] = useState('');             // Output of ia file searching
  const [status, setStatus] = useState("Operational");    // Status of task polling

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Dry run functions

  // Debounce input fields, so it doesnt constantly update per char change
  useEffect(() => {
    const timer = setTimeout(() => {
      seturl(inputurl);
      setGlob(inputGlob);
      // setExclude(inputExclude);
    }, 1000);

    return () => clearTimeout(timer);
  }, [inputurl, inputGlob]);

  // Auto get list of files when fields are updated after debounce
  useEffect(() => {
    const getDryRun = async () => {
      try {
        const res = await axios.post(`http://${window.location.hostname}:5000/api/list`,{
          url: url,
          glob: glob,
          // exclude: exclude
        });

        setResGlob(res.data.result);
        console.log(`Passed dry run for ${url}\n`, res.data.result)
      }
      catch (eva) {
        console.error("Failed to get dry run: ", eva)
        setResGlob(`Error retriving list for: ${url}\nMay not have been able to determine identifier`);
      }
    };

    getDryRun()
  }, [url, glob]);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Downloading functions

  // Start download when button is pressed
  async function startDownload() {
    const res = await axios.post(`http://${window.location.hostname}:5000/api/download`,{
        url: url,
        glob: glob,
        // exclude: exclude
      });

    if(res.status < 200 || res.status >= 300){
      console.error('Failed to start download');
      setStatus('Failed')
      return;
    }
    setStatus(`Last task: ${res.data.task_id}`);

    // const socket = io(`http://${window.location.hostname}:5000`, {transports: ['websocket', 'polling']});

    // socket.on('task_status', (data) => {
    //   console.log(data);

    //   if(data.status === 'Completed'){
    //     setStatus("Complete");
    //     socket.disconnect();
    //   }
    // })
  };

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Display JSX

  return (
    <div className={styles.globalback}>
      <Card className={`cardcss ${styles.globalmainback}`}>
        <Typography variant='h4' className={styles.globaltitle}>
          Internet Archive File Downloader
        </Typography>
        <br />
        <div style={{display: "flex", alignItems: 'center', justifyContent: 'space-between',}}>
          <div className='leftInputs'>
            <TextField label="URL/Identifier" value={inputurl} onChange={(eva) => setinputurl(eva.target.value)}></TextField>
            <TextField label="Glob Pattern" value={inputGlob} onChange={(eva) => setInputGlob(eva.target.value)}></TextField>
            {/* <TextField label="Exclude Pattern" value={inputExclude} onChange={(eva) => setInputExclude(eva.target.value)}></TextField> */}
          </div>
          <div className="rightInputs" style={{display: 'flex', flexDirection: 'column', alignItems: 'right'}}>
            <Button variant='outlined' startIcon={<DownloadIcon />} onClick={(eva) => startDownload()}>
              Begin Download
            </Button>
            <div>
              <Typography className={styles.globaltext}>
                {status}
              </Typography>
            </div>
          </div>
        </div>
        <br />
        <TabbedArea url={url} globing={resGlob} />
      </Card>
    </div>
  );
}

export default Ia;
