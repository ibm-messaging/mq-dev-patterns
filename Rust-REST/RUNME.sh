curdir=`pwd`

cd $curdir/Rust_REST_Post
echo "hello from Rust at `date`"| cargo run


echo "----------------------"

cd $curdir/Rust_REST_Delete
cargo run

