const UserModel = firebase.auth();
const dataBase = firebase.firestore();

const router = Sammy('#root', function () {

    this.use("Handlebars", "hbs");

    this.get('/home', function (context) {
        margeTemplates(context)
            .then(function () {
                this.partial('/templates/home.hbs');
            });
    });

    this.get('/register', function (context) {
        margeTemplates(context)
            .then(function () {
                this.partial('/templates/register.hbs');
            });
    });
    this.post('/register', function (context) {
        const { email, password, repeatPassword } = context.params;


        if (password !== repeatPassword) {
            return;
        }

        UserModel.createUserWithEmailAndPassword(email, password)
            .then((userData) => {
                saveCurrentUserData(userData);
                this.redirect('#/home');
            })
            .catch(errorHandler);
    })

    this.get('/login', function (context) {
        margeTemplates(context)
            .then(function () {
                this.partial('/templates/login.hbs');
            });
    });
    this.post('/login', function (context) {
        const { email, password } = context.params;

        UserModel.signInWithEmailAndPassword(email, password)
            .then((userData) => {
                saveCurrentUserData(userData);
                this.redirect("#/home");
            })
            .catch(errorHandler);
    });

    this.get('/logout', function (context) {
        UserModel.signOut()
            .then(res => {
                clearCurrentUser();
                this.redirect('#/home');
            })
            .catch(errorHandler);
    })

    this.get('/createOffer', function (context) {
        margeTemplates(context)
            .then(function () {
                this.partial('/templates/createOffer.hbs');
            });
    });
    this.post('/createOffer', function (context) {
        const { product, price, description, pictureUrl } = context.params;
        const urlRegex = /^https:\/\//gm;
        let counter = 0;

        if (!product || !price || !description || !urlRegex.test(pictureUrl)) {
            return;
        }

        dataBase.collection('offers').add({
            counter,
            product,
            price,
            description,
            pictureUrl,
            creater: getCurrentUser().uid
        }).then(createOffer => {
            this.redirect('#/dashboard');
        }).catch(errorHandler);

    });

    this.get('/dashboard', function (context) {

        dataBase.collection('offers')
            .get()
            .then(response => {

                context.offers = response.docs.map((offer) => {
                    const createrOffer = offer.data().creater === getCurrentUser().uid;

                    return { id: offer.id, createrOffer, ...offer.data() };
                });

                margeTemplates(context)
                    .then(function () {
                        this.partial('/templates/dashboard.hbs');
                    });
            })
            .catch(errorHandler);
    });

    this.get('/details/:offerId', function (context) {
        const { offerId } = context.params;

        dataBase.collection('offers')
            .doc(offerId)
            .get()
            .then(res => {
                context.offer = { ...res.data() };

                margeTemplates(context)
                    .then(function () {
                        this.partial('/templates/details.hbs');
                    });
            });

        margeTemplates(context)
            .then(function () {
                this.partial('/templates/details.hbs');
            });
    });

    this.get('/edit/:offerId', function (context) {
        const { offerId } = context.params;

        dataBase.collection('offers')
            .doc(offerId)
            .get()
            .then(res => {
                context.offer = { id: offerId, ...res.data() };

                margeTemplates(context)
                    .then(function () {
                        this.partial('/templates/edit.hbs');
                    });
            });
    });
    this.post('/edit/:offerId', function (context) {
        const { description, offerId, pictureUrl, price, product } = context.params;

        dataBase.collection('offers')
            .doc(offerId)
            .update({ description, offerId, pictureUrl, price, product })
            .then(res => {
                this.redirect(`#/dashboard`);
            }).catch(errorHandler)
    });

    this.get('/delete/:offerId', function (context) {
        const { offerId } = context.params;

        dataBase.collection('offers')
            .doc(offerId)
            .get()
            .then(res => {
                context.offer = { id: offerId, ...res.data() };

                margeTemplates(context)
                    .then(function () {
                        this.partial('/templates/delete.hbs');
                    });
            });
    });
    this.post('/delete/:offerId', function (context) {
        const { offerId } = context.params;

        dataBase.collection('offers')
            .doc(offerId)
            .delete()
            .then((res) => {
                this.redirect('#/dashboard');
            }).catch(errorHandler);
    });


});

function margeTemplates(context) {
    const user = getCurrentUser();

    context.isloggedIn = Boolean(user);
    context.email = user ? user.email : "";


    return context.loadPartials({
        'header': './partials/header.hbs',
        'footer': './partials/footer.hbs',
    });
};

function saveCurrentUserData(data) {
    const {
        user: {
            uid,
            email
        }
    } = data;
    localStorage.setItem('userInfo', JSON.stringify({
        uid,
        email
    }));
}

function getCurrentUser() {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
}

function clearCurrentUser() {
    this.localStorage.removeItem('userInfo');
}

function errorHandler(error) {
    console.log(error);
}

(() => {
    router.run('#/home');
})();