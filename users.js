let users = [];
const add_user = ({ socket_id, member_id }) => {
    const existing_user = users.find( user => user.socket_id === socket_id && user.member_id === member_id )
    if(!existing_user) users.push({ socket_id, member_id })
    return users
}

const remove_user = (socket_id) => {
    const remaining_users = users.filter( user => user.socket_id !== socket_id )
    users = remaining_users
    return remaining_users
}

module.exports = {
    add_user, 
    remove_user
}