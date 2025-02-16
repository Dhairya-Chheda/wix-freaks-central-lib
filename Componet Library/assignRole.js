import { authorization } from "wix-members-backend";

export const assignRoleFunction = (roleId, memberId) => {

const options = {
    suppressAuth: false,
};

return authorization
    .assignRole(roleId, memberId, options)
    .then(() => {
        console.log("Role assigned to member");
    })
    .catch((error) => {
        console.error(error);
    });
}