import './Ia.css'
import styles from '../global.module.css';
import { Button, Card, TextField, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
// import Header from '../Components/Header';
import TabbedArea from '../Components/TabbedArea';
import { useEffect, useState } from 'react';
import axios from 'axios';

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Classes

  // Defined class to hold task data and status
  export class taskData {
    constructor(id, url, glob, res){
      this.id = id;
      this.url = url;
      this.status = 'IDLE';
      this.glob = glob
      this.res = res;
    }

    getID() {return this.id;}
    getURL() {return this.url;}
    getStatus() {return this.status;}

  }

  // const tmpTask = new taskData('5aa61d6b-c9f3-4c68-95e6-272c2f5f7ad9', 'mister-ed-s-04', '*', 'Mister Ed S04E02 Wilbur Post, Honorary Horse.mp4 Mister Ed S04E03 Ed Discovers America.mp4 Mister Ed S04E04 Patter of Little Hooves.mp4')

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
  const [taskArr, setTaskArr] = useState([]);             // Array of running/completed tasks

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

    const newTask = new taskData(res.data.task_id, url, glob, resGlob);

    setTaskArr([newTask, ...taskArr]);
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
        <TabbedArea url={url} globing={resGlob} taskArr={taskArr} />
      </Card>
    </div>
  );
}

export default Ia;
