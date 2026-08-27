import React from 'react';
import PreviewStateScreen from '../components/PreviewStateScreen';

export default function JobsScreen({ navigation }) {
  return <PreviewStateScreen navigation={navigation} icon="briefcase-outline" title="Jobs" body="Current job listings are not available from a reviewed production source." />;
}
