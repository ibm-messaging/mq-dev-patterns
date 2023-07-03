//Trait for giving a type a default value
//struct provides a structure in which to fill out variables
#[derive(Default)]
pub struct Options {
    pub hostname: String,
    pub port: String,
    pub qmgr: String,
    pub queue_name: String,
    pub app_user: String,
    pub app_pass: String,
}

//Implements the structure Options
//Creates setting functions - allocates values to variables below
impl Options {
    pub fn hostname_mut(&mut self) -> &mut String {
        &mut self.hostname
    }

    pub fn port_mut(&mut self) -> &mut String {
        &mut self.port
    }

    pub fn qmgr_mut(&mut self) -> &mut String {
        &mut self.qmgr
    }

    pub fn queue_name_mut(&mut self) -> &mut String {
        &mut self.queue_name
    }

    pub fn app_user_mut(&mut self) -> &mut String {
        &mut self.app_user
    }

    pub fn app_pass_mut(&mut self) -> &mut String {
        &mut self.app_pass
    }
}
