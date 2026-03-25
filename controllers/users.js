const User = require("../models/user");
const { sendEmail } = require("../brevo");

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.signup = async (req, res) => {
    try {
        let { username, email, password } = req.body;
        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);
        console.log(registeredUser);

        // ✅ Send welcome email after successful registration
        await sendEmail({
            toEmail: email,
            toName: username,
            subject: "Welcome to Wanderlust! 🎉",
            htmlContent: `
                <h2>Hello ${username}!</h2>
                <p>Welcome to <strong>Wanderlust</strong> 🌍</p>
                <p>Your account has been created successfully.</p>
                <p>Start exploring amazing listings now!</p>
            `,
        });

        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Welcome to Wanderlust..");
            res.redirect("/listings");
        });

    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
    req.flash("success", "Welcome back to Wanderlust!!");
    const redirectUrl = res.locals.redirectUrl || "/listings";
    return res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "You are logged out!");
        res.redirect("/listings");
    });
};

