import {getFirestore} from '@firebase/firestore';
import app from '../config/firebase';

const firestore = getFirestore(app);

export default firestore;
