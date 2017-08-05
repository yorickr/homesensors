import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export default {
    encrypt (password) {
        return bcrypt.hash(password, SALT_ROUNDS);
    },

    check (password, hash) {
        return bcrypt.compare(password, hash);
    }
};
