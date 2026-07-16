const { createDMG } = require('electron-builder');
const path = require('path');
const fs = require('fs');

async function buildDMG() {
  const config = {
    appPath: path.join(__dirname, '../dist-electron/mac/Axiom AI.app'),
    outPath: path.join(__dirname, '../dist-electron'),
    title: 'Axiom AI Installer',
    icon: path.join(__dirname, '../public/Logo.png'),
    background: path.join(__dirname, '../public/dmg-background.png'),
    iconSize: 128,
    contents: [
      {
        x: 130,
        y: 240,
        type: 'file',
        path: path.join(__dirname, '../dist-electron/mac/Axiom AI.app'),
        name: 'Axiom AI.app'
      },
      {
        x: 380,
        y: 240,
        type: 'link',
        path: '/Applications',
        name: 'Applications'
      }
    ],
    window: {
      width: 660,
      height: 400,
      position: 'center'
    },
    format: 'UDZO',
    signing: {
      identity: 'Developer ID Application: Your Name'
    }
  };

  try {
    await createDMG(config);
    console.log('✅ DMG created successfully!');
  } catch (error) {
    console.error('❌ Error creating DMG:', error);
  }
}

buildDMG();