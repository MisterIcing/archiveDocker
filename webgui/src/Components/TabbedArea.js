/* Taken from Capstone project */

import { Box, Container, Paper, Tab, Tabs, Typography } from "@mui/material";
import { useState } from "react";
import './TabbedArea.css';
import styles from '../global.module.css';
import TaskOutput from './TaskOutput';

function OutputInfo(props) {
  const [tab, setTab] = useState(0)

  const taskArr = props.taskArr;

  const tabs = [
    <Tab key="0" label="Search Results"></Tab>,
    <Tab key="1" label="Tasks"></Tab>
  ]

  const handleTabChange = (event, value) => {
    setTab(value);
  }

  // Return to when Output format is confirmed
  return (
    <Paper className={`mainbody ${styles.globalsecback}`} sx={{ overflowY: 'auto' }}>
      <Box sx={{ width: '100%', overflowY: 'auto' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tab}
            onChange={handleTabChange}
            variant='scrollable'
            scrollButtons='auto'
          >
            {tabs}
          </Tabs>
        </Box>
        <Container sx={{ padding: '10px', maxHeight: '70vh', overflowY: 'auto' }} >
          <Box sx={{ fontFamily: 'Monospace' }}>
            <div style={{ display: tab === 0 ? "block" : "none" }}>
              {props.globing ? (
                <Typography className={styles.globaltext} style={{ whiteSpace: "pre-line" }}>
                  {props.globing}
                </Typography>
              ) : (
                <Typography className={styles.globaltext} style={{ whiteSpace: "pre-line" }}>
                  No Output Found for {props.url}
                </Typography>
              )}
            </div>
            <div style={{ display: tab === 1 ? "block" : "none" }}>
              {taskArr.length > 0 ? (
                <div>
                  {taskArr.map((task) => (
                    <TaskOutput key={task.id} task={task} />
                  ))}
                </div>
              ) : (
                <Typography className={styles.globaltext} style={{ whiteSpace: "pre-line" }}>
                  No Tasks
                </Typography>
              )}
            </div>
            <div style={{ display: tab > 1 ? "block" : "none" }}>
              <Typography className={styles.globaltext} style={{ whiteSpace: "pre-line" }}>
                Invalid Tab Selection?
              </Typography>
            </div>
          </Box>
        </Container>
      </Box>
    </Paper>
  )
}

export default OutputInfo