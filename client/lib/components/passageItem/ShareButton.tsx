import {Image, StyleSheet, View} from 'react-native';
import IconButton from '../common/IconButton';
import Share from 'react-native-share';
import React from 'react';
import ViewShot from 'react-native-view-shot';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

type Props = {
  shareType: string;
  backgroundColor: string;
  viewShotRef: React.RefObject<ViewShot>;
};

const ShareButton = (props: Props) => {
  const {shareType} = props;

  return (
    <IconButton
      style={styles.button}
      textStyle={{
        ...styles.buttonText,
      }}
      onPress={() => {
        shareContent(props);
      }}
      icon={shareIcon(shareType)}
      text={shareText(shareType)}
    />
  );
};

const shareIcon = (shareType: string) => {
  switch (shareType) {
    case Share.Social.INSTAGRAM_STORIES:
      return (
        <Image
          source={require('../../assets/instagram_icon.png')}
          style={styles.icon}
        />
      );
    case 'other':
      return (
        <View style={styles.moreIcon}>
          <MaterialIcon name="more-horiz" size={56} color="darkgrey" />
        </View>
      );
    default:
      throw new Error(`Unknown share type: ${shareType}`);
  }
};

const shareText = (shareType: string) => {
  switch (shareType) {
    case Share.Social.INSTAGRAM_STORIES:
      return 'stories';
    case 'other':
      return 'other';
    default:
      throw new Error(`Unknown share type: ${shareType}`);
  }
};

const shareContent = (props: Props) => {
  const {shareType, viewShotRef, backgroundColor} = props;

  switch (shareType) {
    case Share.Social.INSTAGRAM_STORIES:
      if (viewShotRef.current && viewShotRef.current.capture) {
        viewShotRef.current.capture().then(res => {
          // https://developers.facebook.com/docs/instagram/sharing-to-stories/#sharing-to-stories
          const shareOptions = {
            stickerImage: res,
            backgroundBottomColor: backgroundColor,
            backgroundTopColor: backgroundColor,
            // attributionURL: 'http://deep-link-to-app', //in beta
            social: Share.Social.INSTAGRAM_STORIES as any,
            appId: '279012348258138',
          };
          Share.shareSingle(shareOptions);
        });
      }
      break;
    case 'other':
      if (viewShotRef.current && viewShotRef.current.capture) {
        viewShotRef.current.capture().then(res => {
          console.log(res);
          const shareOptions = {
            url: `file://${res}`,
            type: 'image/png',
          };
          Share.open(shareOptions).catch(err => {
            console.log(err);
          });
        });
      }
      break;
    default:
      throw new Error(`Unknown share type: ${shareType}`);
  }
};

export default ShareButton;

const styles = StyleSheet.create({
  icon: {
    width: 56,
    height: 56,
  },
  moreIcon: {
    width: 56,
    height: 56,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  button: {
    flexDirection: 'column',
    marginHorizontal: 24,
  },
  buttonText: {
    fontSize: 12,
    paddingTop: 2,
    color: 'black',
  },
});
