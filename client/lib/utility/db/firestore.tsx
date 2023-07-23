import {getFirestore} from '@firebase/firestore';
import app from '../firebase';

const firestore = getFirestore(app);

export default firestore;
