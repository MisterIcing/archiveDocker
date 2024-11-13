/* Taken from Capstone project */

import {Box, Container, Paper, Tab, Tabs, Typography} from "@mui/material";
import {useState} from "react";
import './TabbedArea.css'
import styles from '../global.module.css'

function OutputInfo(props) {

    const [tab, setTab] = useState(0)

    const tabs = [
        <Tab key="0" label="Files"></Tab>,
        <Tab key="1" label="Console"></Tab>
    ]

    const handleTabChange = (event, value) => {
        setTab(value);
    }

    // Return to when Output format is confirmed
    return(
        <Paper className={`mainbody ${styles.globalsecback}`} sx={{overflowY: 'auto'}}>
            <Box sx={{ width: '100%', overflowY:'auto'}}>
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
                <Container sx={{ padding: '10px', maxHeight: '70vh', overflowY: 'auto'}} >
                    <Box sx={{fontFamily: 'Monospace'}}>
                        <Typography className={styles.globaltext} style={{whiteSpace: 'pre-line'}}>
                            {tab === 0 ? 
                                props.globing ?
                                    props.globing
                                    :
                                    `No Output Found for ${props.url}`
                                :
                             tab === 1 ?
                                props.active ?
                                    props.downloading
                                    :
                                    "Not Downloading"
                                :
                            "Invalid Tab Selection?"
                            }
                        </Typography>
                    </Box>
                </Container>
            </Box>
        </Paper>
    )
}

export default OutputInfo